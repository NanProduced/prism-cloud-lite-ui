// Device Details and Properties Type Definitions

import type { Device } from './device';

export interface DeviceProperties {
  terminal?: {
    name: string;
    leddescription: string;
    reportTime: number;
  };
  websocketStatus?: {
    status: number; // 1 = connected, 0 = disconnected
  };
  powerstatus?: {
    powerstatus: number; // 0 = off, 1 = on
    reportTime: number;
  };
  info?: {
    info: {
      vername: string;
      serialno: string;
      model: string;
      up: number; // uptime in seconds
      mem: {
        total: number;
        free: number;
      };
      storage: {
        total: number;
        free: number;
      };
      playing: {
        name: string;
        path: string;
        source: string;
      };
    };
    reportTime: number;
  };
  vsns?: {
    contents: Array<{
      type: string;
      ressize: number;
      unused: number;
      content: Array<{
        md5: string;
        name: string;
        publishedmd5: string;
        size: number;
      }>;
    }>;
    playing: {
      name: string;
      path?: string;
      source?: string;
      type?: string;
    };
    reportTime: number;
  };
  dimension?: {
    width: number;
    height: number;
    fps: number;
    dclk: number;
    real_width: number;
    real_height: number;
    reportTime: number;
  };
  volume?: {
    musicvolume: number;
    reportTime: number;
  };
  inputmode?: {
    inputmode: string;
    inputmodeactive: string;
    reportTime: number;
  };
  ifstatus?: {
    types: Array<{
      type: string;
      enabled: number;
      connected: number;
      operstate: string;
      mode: string;
      mac: string;
      ips?: {
        ip: string;
        mask: string;
        broadcast: string;
        gateway: string;
        dns1: string;
        dns2: string;
      };
      SSID?: string;
      strength?: number;
      speed?: number;
    }>;
  };
  brightnessandcolortemp?: {
    brightness: number;
    colortemperature: number;
    reportTime: number;
  };
  newrtc?: {
    time: string;
    timezoneId: string;
    timezone: number;
    isautotime: number;
    reportTime: number;
  };
  locale?: {
    language: string;
    country: string;
  };
  allbrightnessinfo?: {
    realTimeBrightValue: number;
    savedBrightValue: number;
    isbShowOn: boolean;
    isHasSensor: boolean;
    sensorBright: number;
  };
  [key: string]: any; // Allow for other fields
}

export interface DeviceDetails extends Device {
  deviceProperties?: DeviceProperties;
}
