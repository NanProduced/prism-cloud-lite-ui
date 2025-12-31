export type VsnDocument = {
  Programs: {
    Program: VsnProgram;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type VsnProgram = {
  Information: VsnInformation;
  Pages: {
    Page: VsnPage[];
    [key: string]: unknown;
  };
  Id?: string | null;
  [key: string]: unknown;
};

export type VsnInformation = {
  Width: string;
  Height: string;
  Scale?: string | null;
  [key: string]: unknown;
};

export type VsnPage = {
  AppointDuration: string;
  LoopType: '0' | '1';
  BgColor: string;
  BgFile?: VsnBgFile | null;
  Regions: {
    Region: VsnRegion[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type VsnBgFile = {
  IsRelative: '0' | '1';
  FilePath?: string | null;
  Resource_ID?: string | null;
  OriginName?: string | null;
  [key: string]: unknown;
};

export type VsnRegion = {
  Layer?: string;
  Rect: VsnRect;
  Name: string;
  IsScheduleRegion: '0' | '1';
  Items: {
    Item: VsnItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type VsnRect = {
  X: string;
  Y: string;
  Width: string;
  Height: string;
  BorderWidth: string;
  BorderColor?: string | null;
  BackColor?: string | null;
  [key: string]: unknown;
};

export type VsnItem = {
  Type: string;
  Duration?: string;
  PlayLength?: string;
  PlayTimes?: string;
  Alhpa?: string;
  ReserveAS?: '0' | '1' | string;
  FileSource?: VsnFileSource;
  Volume?: string;
  Loop?: string;
  IsScroll?: string;
  Text?: string;
  TextColor?: string;
  backcolor?: string;
  LogFont?: VsnLogFont;
  [key: string]: unknown;
};

export type VsnFileSource = {
  Resource_ID: string;
  FilePath?: string | null;
  OriginName?: string | null;
  IsRelative?: '0' | '1' | null;
  MD5?: string | null;
  [key: string]: unknown;
};

export type VsnLogFont = {
  lfHeight: string;
  lfFaceName?: string | null;
  lfWeight?: string | null;
  lfItalic?: string | null;
  lfUnderLine?: string | null;
  [key: string]: unknown;
};
