#!/usr/bin/env node
'use strict';

import Timeout = NodeJS.Timeout;

import {get} from 'lodash';
import {Subject, Subscription} from 'rxjs';

import AStore from './store/a.store';
import storeFactory from './store/factories/store.factory';
import IConnectionManager from './auth/i.connection.manager';
import DataMiddlewareMap from './middleware/data.middleware.map';
import StoreSubscriptionUpdateType from './_types/store.subscription.update.type';

export default class OwservableClient extends Subject<any> {
	private _connectionManager: IConnectionManager;

	private _ping = 0;
	private _location: string;
	private _stores: Map<string, AStore>;
	private _subscriptions: Map<string, Subscription>;
	private _timeout: Timeout;

	public constructor(connectionManager: IConnectionManager) {
		super();
		this._connectionManager = connectionManager;
		this._stores = new Map<string, AStore>();
		this._subscriptions = new Map<string, Subscription>();
	}

	public disconnected(): void {
		// console.log('ows -> OwservableClient disconnected');
		this.clearSubscriptions();
		this._connectionManager.disconnected();
		clearTimeout(this._timeout);
	}

	public async consume(message: any): Promise<void> {
		// console.log('ows -> OwservableClient::consume received message", message.type);

		switch (message.type) {
			case 'pong':
				this._processPong(message);
				return;

			case 'authenticate':
				this._connectionManager.connected(message.jwt);
				this._checkSession();
				return;

			case 'location':
				const {path} = message;
				this.location = path;
				return;

			case 'subscribe':
				this.updateSubscription(message);
				return;

			case 'unsubscribe':
				this.removeSubscription(message.target);
				return;

			case 'reload':
				this.reloadData(message.target);
				return;
		}
	}

	public ping() {
		this.next({type: 'ping', id: new Date().getTime()});
		setTimeout(() => this.ping(), 60000);
	}

	private _processPong(message: any): void {
		const response = new Date().getTime();
		this._ping = response - message.id;
		this._connectionManager.ping(this._ping);
	}

	private _checkSession(): void {
		const check = this._connectionManager.checkSession();
		if (check) this.next(check);

		const refreshIn = get(check, 'refresh_in', 299000); // 299000 = 4min 59sec

		clearTimeout(this._timeout);
		this._timeout = setTimeout(() => {
			this._checkSession();
		}, refreshIn);
	}

	private set location(location: string) {
		// console.log('ows -> OwservableClient location: old:[${this._location}] new:[${location}]`);
		if (location === this._location) return;
		this._location = location;

		this.clearSubscriptions();

		this._stores = new Map<string, AStore>();
		this._subscriptions = new Map<string, Subscription>();

		this._connectionManager.location(location);
	}

	private removeSubscription(target: string): void {
		// console.log('ows -> OwservableClient removeSubscription: ${target}`);
		let store = this._stores.get(target);
		if (store) store.destroy();
		store = null;
		this._stores.delete(target);

		let subscription = this._subscriptions.get(target);
		if (subscription) subscription.unsubscribe();
		subscription = null;
		this._subscriptions.delete(target);
	}

	private reloadData(target: string): void {
		// console.log('ows -> OwservableClient reloadData: ${target}`);
		const store = this._stores.get(target);
		store.restartSubscription();
	}

	private updateSubscription(subscriptionConfig: StoreSubscriptionUpdateType): void {
		const {target, scope, observe, config} = subscriptionConfig;
		// console.log('ows -> OwservableClient updateSubscription: ${target}`);

		let store = this._stores.get(target);
		if (store) {
			store.config = config;

		} else {
			store = storeFactory(scope, observe, target);

			this._stores.set(target, store);
			const subscription = store.subscribe({
				next: async (m: any): Promise<void> => {
					if (DataMiddlewareMap.hasMiddleware(scope, observe)) {
						const process = DataMiddlewareMap.getMiddleware(scope, observe);
						m = await process(m, this._connectionManager.user);
					}
					this.next(m);
				},
				error: (e: any): void => this.error(e),
				complete: (): void => this.complete()
			});
			this._subscriptions.set(target, subscription);

			store.config = config;
		}
	}

	private clearSubscriptions(): void {
		const subscriptionsKeys = this._subscriptions.keys();
		// console.log(' -- OwservableClient clearSubscriptions', subscriptionsKeys);
		for (const subscriptionKey of subscriptionsKeys) {
			let subscription = this._subscriptions.get(subscriptionKey);
			subscription.unsubscribe();
			subscription = null;
		}
		this._subscriptions.clear();
		this._subscriptions = null;

		const storesKeys = this._stores.keys();
		for (const storeKey of storesKeys) {
			let store = this._stores.get(storeKey);
			store.destroy();
			store = null;
		}
		this._stores.clear();
		this._stores = null;
	}
}
