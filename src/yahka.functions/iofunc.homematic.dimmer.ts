import { TIoBrokerInOutFunctionBase, IInOutFunction, IInOutChangeNotify } from './iofunc.base';
import { isObject } from 'util';
import { propertyExists } from '../shared/yahka.utils';


export interface TIoBrokerInOutFunction_Homematic_Dimmer_Parameter {
    levelState: string;
    restoreToPreviousLevel?: boolean;
    defaultSwitchOnLevel?: number;
}

export function isHomematic_Dimmer_Parameter(value: any): value is TIoBrokerInOutFunction_Homematic_Dimmer_Parameter {
    if (value === undefined)
        return false;
    if (!isObject(value))
        return false;
    return propertyExists<TIoBrokerInOutFunction_Homematic_Dimmer_Parameter>(value, "levelState")
}


export class TIoBrokerInOutFunction_Homematic_Dimmer_Base extends TIoBrokerInOutFunctionBase {
    protected lastOnLevel: ioBroker.IState = { val: undefined };
    static parseParameters(parameters: any): TIoBrokerInOutFunction_Homematic_Dimmer_Parameter {
        if (!isHomematic_Dimmer_Parameter(parameters)) {
            return undefined
        };
        return parameters;
    }
    constructor(adapter: ioBroker.IAdapter, functionName: string, protected parameters: TIoBrokerInOutFunction_Homematic_Dimmer_Parameter) {
        super(adapter, functionName + "[" + parameters.levelState + "]");
        this.addSubscriptionRequest(parameters.levelState);
    }

    protected cacheChanged(stateName: string, callback: IInOutChangeNotify) {
        // save level if we are switching off
        if (stateName === this.parameters.levelState) {
            const cacheValue = this.readValueFromCache(stateName);
            if (cacheValue.val > 0) {
                this.lastOnLevel = cacheValue;
            }
        }
        super.cacheChanged(stateName, callback);
    }
}



export class TIoBrokerInOutFunction_Homematic_Dimmer_On extends TIoBrokerInOutFunction_Homematic_Dimmer_Base {
        static create(adapter: ioBroker.IAdapter, parameters: any): IInOutFunction {
        let params = TIoBrokerInOutFunction_Homematic_Dimmer_On.parseParameters(parameters);
        if (params === undefined) {
            return undefined
        }
        return new TIoBrokerInOutFunction_Homematic_Dimmer_On(adapter, params);
    }

    constructor(protected adapter: ioBroker.IAdapter, protected parameters: TIoBrokerInOutFunction_Homematic_Dimmer_Parameter) {
        super(adapter, "Homematic.Dimmer.On", parameters);
    }

    protected recalculateHomekitValues(stateName: string) {
        let hkValue = this.stateCache.get(this.parameters.levelState);
        return Boolean(hkValue.val > 0);
    }

    protected updateIOBrokerValue(plainIoValue: any, callback: () => void) {
        setTimeout(() => this.executeIOBrokerValue(plainIoValue, callback), 50);
    }
    protected executeIOBrokerValue(plainIoValue: any, callback: () => void) {

        const isSwitchingOn = Boolean(plainIoValue);
        const stateName = this.parameters.levelState;

        const newOnValue = (this.parameters.restoreToPreviousLevel ? this.lastOnLevel.val : this.parameters.defaultSwitchOnLevel) || this.parameters.defaultSwitchOnLevel || 100;
        const newOffValue = 0;
        const newValue = isSwitchingOn ? newOnValue : newOffValue;

        if (isSwitchingOn && this.parameters.restoreToPreviousLevel) {
            this.log.debug('using previous level for switching on: ' + JSON.stringify(this.lastOnLevel.val));
        }


        this.log.debug('writing state to ioBroker [' + stateName + ']: ' + JSON.stringify(newValue));
        this.adapter.getForeignState(stateName, (error, ioState) => {
            let value = ioState.val;
            if (isSwitchingOn && value > 0) {
                this.log.debug('function should switch on but level is already not equal to 0: ' + JSON.stringify(value));
                callback();
                return;
            }

            let valueChanged = value !== newValue;
            this.log.debug('checking value change: ' + JSON.stringify(value) + ' != ' + JSON.stringify(newValue) + ' = ' + valueChanged);
            if (valueChanged) {
                this.adapter.setForeignState(stateName, newValue, false, (error) => {
                    if (error) {
                        this.log.error('setForeignState error [' + stateName + '] to [' + JSON.stringify(newValue) + ']: ' + error);
                        callback();
                    }
                    callback();
                });
            } else {
                callback();
            }
        });

    }
}


export class TIoBrokerInOutFunction_Homematic_Dimmer_Brightness extends TIoBrokerInOutFunction_Homematic_Dimmer_Base {
    static create(adapter: ioBroker.IAdapter, parameters: any): IInOutFunction {
        let params = TIoBrokerInOutFunction_Homematic_Dimmer_On.parseParameters(parameters);
        if (params === undefined) {
            return undefined
        }
        return new TIoBrokerInOutFunction_Homematic_Dimmer_Brightness(adapter, params);
    }

    constructor(protected adapter: ioBroker.IAdapter, protected parameters: TIoBrokerInOutFunction_Homematic_Dimmer_Parameter) {
        super(adapter, "Homematic.Dimmer.Brightness", parameters);
    }

    protected recalculateHomekitValues(stateName: string) {
        let hkValue = this.stateCache.get(this.parameters.levelState);
        return hkValue.val == 0 ? this.lastOnLevel.val : hkValue.val;
    }

    protected updateIOBrokerValue(plainIoValue: any, callback: () => void) {
        const newValue = plainIoValue;
        const stateName = this.parameters.levelState;


        this.log.debug('writing state to ioBroker [' + stateName + ']: ' + JSON.stringify(newValue));
        this.adapter.getForeignState(stateName, (error, ioState) => {
            let value = ioState.val;
            let valueChanged = value !== newValue;
            this.log.debug('checking value change: ' + JSON.stringify(value) + ' != ' + JSON.stringify(newValue) + ' = ' + valueChanged);
            if (valueChanged) {
                this.adapter.setForeignState(stateName, newValue, false, (error) => {
                    if (error) {
                        this.log.error('setForeignState error [' + stateName + '] to [' + JSON.stringify(newValue) + ']: ' + error);
                        callback();
                    }
                    callback();
                });
            } else {
                callback();
            }
        });

    }
}