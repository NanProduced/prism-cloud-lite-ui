// Logo imports - SVG files imported as URLs
import galeriesLafayette from "./galeries-lafayette.svg";
import laneCrawford from "./lane-crawford.svg";
import hyatt from "./hyatt.svg";
import chinaSouthern from "./china-southern.svg";
import samsung from "./samsung.svg";
import citibank from "./citibank.svg";
import airbnb from "./airbnb.svg";
import chinaResources from "./china-resources.svg";
import airChina from "./air-china.svg";
import americanExpress from "./american-express.svg";
import arcTeryx from "./arc-teryx.svg";
import asusRog from "./asus-rog.svg";
import amd from "./amd.svg";
import ducati from "./ducati.svg";
import dyson from "./Dyson.svg";
import devialet from "./logo-de-devialet.svg";
import loreal from "./l-oreal.svg";
import mgmGrand from "./mgm-grand.svg";
import pingAn from "./ping-an.svg";
import playstation from "./playstation.svg";
import redbull from "./redbullenergydrink.svg";
import samsClub from "./sams-club.svg";
import sfExpress from "./sf-express.svg";
import siemens from "./siemens.svg";
import macallan from "./the-macallan.svg";
import chinaTobacco from "./china-tabacco.svg";

export interface BrandLogo {
  name: string;
  nameZh: string;
  src: string;
  industry: string;
  industryZh: string;
  scale?: number;
}

// Primary logos (used in testimonials)
export const primaryLogos: BrandLogo[] = [
  { name: "Galeries Lafayette", nameZh: "老佛爷百货", src: galeriesLafayette, industry: "Retail", industryZh: "零售", scale: 1.9 },
  { name: "Lane Crawford", nameZh: "连卡佛", src: laneCrawford, industry: "Retail", industryZh: "零售", scale: 1.2 },
  { name: "Hyatt", nameZh: "凯悦", src: hyatt, industry: "Hospitality", industryZh: "酒店", scale: 3.6 },
  { name: "China Southern", nameZh: "南方航空", src: chinaSouthern, industry: "Transportation", industryZh: "交通", scale: 2.8 },
  { name: "Samsung", nameZh: "三星", src: samsung, industry: "Electronics", industryZh: "电子", scale: 1.2 },
  { name: "Citibank", nameZh: "花旗银行", src: citibank, industry: "Banking", industryZh: "金融", scale: 2.2 },
  { name: "Airbnb", nameZh: "爱彼迎", src: airbnb, industry: "Hospitality", industryZh: "民宿", scale: 1.1 },
  { name: "China Resources", nameZh: "华润", src: chinaResources, industry: "Conglomerate", industryZh: "综合", scale: 1.6 },
];

// Secondary logos (for extended logo wall)
export const secondaryLogos: BrandLogo[] = [
  { name: "Air China", nameZh: "中国国航", src: airChina, industry: "Transportation", industryZh: "交通", scale: 2.6 },
  { name: "Arc'teryx", nameZh: "始祖鸟", src: arcTeryx, industry: "Retail", industryZh: "零售", scale: 1.8 },
  { name: "AMD", nameZh: "AMD", src: amd, industry: "Electronics", industryZh: "电子", scale: 1.0 },
  { name: "American Express", nameZh: "美国运通", src: americanExpress, industry: "Banking", industryZh: "金融", scale: 1.5 },
  { name: "Ducati", nameZh: "杜卡迪", src: ducati, industry: "Automotive", industryZh: "汽车", scale: 2.6 },
  { name: "Dyson", nameZh: "戴森", src: dyson, industry: "Electronics", industryZh: "电子", scale: 1.0 },
  { name: "ASUS ROG", nameZh: "华硕 ROG", src: asusRog, industry: "Electronics", industryZh: "电子", scale: 1.0 },
  { name: "Devialet", nameZh: "帝瓦雷", src: devialet, industry: "Electronics", industryZh: "电子", scale: 1.3 },
  { name: "MGM Grand", nameZh: "美高梅", src: mgmGrand, industry: "Hospitality", industryZh: "酒店", scale: 3.4 },
  { name: "Ping An", nameZh: "平安", src: pingAn, industry: "Banking", industryZh: "金融", scale: 1.1 },
  { name: "PlayStation", nameZh: "PlayStation", src: playstation, industry: "Electronics", industryZh: "电子", scale: 1.1 },
  { name: "L'Oréal", nameZh: "欧莱雅", src: loreal, industry: "Retail", industryZh: "零售", scale: 2.5 },
  { name: "Red Bull", nameZh: "红牛", src: redbull, industry: "F&B", industryZh: "餐饮", scale: 1.0 },
  { name: "Sam's Club", nameZh: "山姆会员店", src: samsClub, industry: "Retail", industryZh: "零售", scale: 1.3 },
  { name: "SF Express", nameZh: "顺丰速运", src: sfExpress, industry: "Logistics", industryZh: "物流", scale: 1.0 },
  { name: "Siemens", nameZh: "西门子", src: siemens, industry: "Electronics", industryZh: "电子", scale: 2.2 },
  { name: "The Macallan", nameZh: "麦卡伦", src: macallan, industry: "F&B", industryZh: "餐饮", scale: 1.2 },
  { name: "China Tobacco", nameZh: "中国烟草", src: chinaTobacco, industry: "Conglomerate", industryZh: "综合", scale: 2.2 },
];

// All logos combined
export const allLogos: BrandLogo[] = [...primaryLogos, ...secondaryLogos];

export default primaryLogos;
