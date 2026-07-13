import type { PlatformAccessory } from 'homebridge';
import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue } from 'homebridge';
import { FlairPlatform } from './platform';
import { Structure } from '@ds-flair/flair-api-ts';
import { FlairApiClient } from './flairApiClient';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class FlairStructurePlatformAccessory {
    private readonly platform;
    private readonly accessory;
    private accessoryInformationService;
    private thermostatService;
    private client;
    private structure;
    constructor(platform: FlairPlatform, accessory: PlatformAccessory, client: FlairApiClient);
    setTargetHeatingCoolingState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    setTargetTemperature(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getTargetTemperature(callback: CharacteristicGetCallback): void;
    updateFromStructure(structure: Structure): void;
    private getCurrentHeatingCoolingState;
    private getTargetHeatingCoolingState;
}
//# sourceMappingURL=structurePlatformAccessory.d.ts.map