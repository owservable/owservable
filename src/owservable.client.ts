'use strict';

import Timeout = NodeJS.Timeout;
import {get, includes, join} from 'lodash';
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
		// console.log('[@owservable] -> OwservableClient disconnected');
		this.clearSubscriptions();
		this._connectionManager.disconnected();
		clearTimeout(this._timeout);
	}

	private set location(location: string) {
		// console.log('[@owservable] -> OwservableClient location: old:[${this._location}] new:[${location}]`);
		if (location === this._location) return;
		this._location = location;

		this._connectionManager.location(location);
	}

	public async consume(message: any): Promise<void> {
		// console.log('[@owservable] -> OwservableClient::consume received message", message.type);

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

	private async _checkSession(): Promise<void> {
		const check = await this._connectionManager.checkSession();
		if (check) this.next(check);

		let refreshIn = get(check, 'refresh_in', 300000); // 300000 = 5min
		refreshIn = Math.round((refreshIn * 95) / 100);

		clearTimeout(this._timeout);
		this._timeout = setTimeout(() => this._checkSession(), refreshIn);
	}

	private removeSubscription(target: string): void {
		// console.log('[@owservable] -> OwservableClient removeSubscription: ${target}`);

		this._subscriptions.get(target)?.unsubscribe();
		this._subscriptions.delete(target);

		this._stores.get(target)?.destroy();
		this._stores.delete(target);

		this.sendDebugTargets('removeSubscription', target);
	}

	private reloadData(target: string): void {
		// console.log('[@owservable] -> OwservableClient reloadData: ${target}`);
		const store = this._stores.get(target);
		store.restartSubscription();
	}

	private updateSubscription(subscriptionConfig: StoreSubscriptionUpdateType): void {
		const {target, scope, observe, config} = subscriptionConfig;
		// console.log('[@owservable] -> OwservableClient updateSubscription: ${target}`);

		let store = this._stores.get(target);
		if (store) {
			store.config = config;
		} else {
			store = storeFactory(scope, observe, target);

			this._stores.set(target, store);
			const subscription = store.subscribe({
				next: async (m: any): Promise<void> => {
					if (DataMiddlewareMap.hasMiddleware(observe)) {
						const process = DataMiddlewareMap.getMiddleware(observe);
						m = await process(m, this._connectionManager.user);
					}
					if (this.isValidTarget(target)) this.next(m);
				},
				error: (e: any): void => this.error(e),
				complete: (): void => this.complete()
			});
			this._subscriptions.set(target, subscription);

			store.config = config;
		}

		this.sendDebugTargets('updateSubscription', target);
	}

	private isValidTarget(target: string): boolean {
		if (!this._stores) return false;
		const targets = Array.from(this._stores.keys());
		return includes(targets, target);
	}

	private sendDebugTargets(event: string, target: string) {
		if (!this._stores) return false;
		const targets = Array.from(this._stores.keys());
		this.next({
			type: 'debug', //
			id: new Date().getTime(),
			payload: {
				event,
				target,
				availableTargets: join(targets, ', ')
			}
		});
	}

	private clearSubscriptions(): void {
		if (this._subscriptions) {
			const subscriptionsKeys = this._subscriptions.keys();
			console.log('[@owservable] -> OwservableClient clearSubscriptions subscriptionsKeys:', subscriptionsKeys);
			for (const subscriptionKey of subscriptionsKeys) {
				this._subscriptions.get(subscriptionKey)?.unsubscribe();
			}
			this._subscriptions.clear();
		}
		this._subscriptions = null;

		if (this._stores) {
			const storesKeys = this._stores.keys();
			console.log('[@owservable] -> OwservableClient clearSubscriptions storesKeys:', storesKeys);
			for (const storeKey of storesKeys) {
				this._stores.get(storeKey)?.destroy();
			}
			this._stores.clear();
		}
		this._stores = null;

		this.sendDebugTargets('clearSubscriptions', '*');
	}
}
