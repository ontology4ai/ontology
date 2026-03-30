import React from 'react';
const Icon = ({ name }: { name: string }) => {
  const iconMap: Record<string, string> = {
    default: new URL(`./assets/icon1.svg`, import.meta.url).href,
    icon1: new URL(`./assets/icon1.svg`, import.meta.url).href,
    icon2: new URL(`./assets/icon2.svg`, import.meta.url).href,
    icon3: new URL(`./assets/icon3.svg`, import.meta.url).href,
    icon4: new URL(`./assets/icon4.svg`, import.meta.url).href,
    icon5: new URL(`./assets/icon5.svg`, import.meta.url).href,
    icon6: new URL(`./assets/icon6.svg`, import.meta.url).href,
    icon7: new URL(`./assets/icon7.svg`, import.meta.url).href,
    icon8: new URL(`./assets/icon8.svg`, import.meta.url).href,
    icon9: new URL(`./assets/icon9.svg`, import.meta.url).href,
    icon10: new URL(`./assets/icon10.svg`, import.meta.url).href,
    icon11: new URL(`./assets/icon11.svg`, import.meta.url).href,
    icon12: new URL(`./assets/icon12.svg`, import.meta.url).href,
    icon13: new URL(`./assets/icon13.svg`, import.meta.url).href,
    icon14: new URL(`./assets/icon14.svg`, import.meta.url).href,
    icon15: new URL(`./assets/icon15.svg`, import.meta.url).href,
    icon16: new URL(`./assets/icon16.svg`, import.meta.url).href,
    icon17: new URL(`./assets/icon17.svg`, import.meta.url).href,
    icon18: new URL(`./assets/icon18.svg`, import.meta.url).href,
    icon19: new URL(`./assets/icon19.svg`, import.meta.url).href,
    icon20: new URL(`./assets/icon20.svg`, import.meta.url).href,
    icon21: new URL(`./assets/icon21.svg`, import.meta.url).href,
    icon22: new URL(`./assets/icon22.svg`, import.meta.url).href,
    icon23: new URL(`./assets/icon23.svg`, import.meta.url).href,
  };

  const iconSrc = iconMap[name] || iconMap.default;

  return <img src={iconSrc} />;
};

const ObjectIconMap = {
    customer: 'icon1',
    warehouse: 'icon3',
    product: 'icon14',
    order: 'icon4',
    waybill: 'icon18',
    factory: 'icon11',
    road: 'icon8',
    flight: 'icon9',
    equipment: 'icon13',
    base_station: 'icon16',
    contract: 'icon21',
    address: 'icon19',
    weather: 'icon20',
    marketing_act: 'icon15',
    logistics_company: 'icon22',
    employee: 'icon12',
    electric_line: 'icon17',
    workorder: 'icon23',
}
const ObjectIcon = ({ objectName }: { objectName: string }) => {
    const lowerCaseName = (objectName || 'default').toLowerCase();
    const iconName = (ObjectIconMap as Record<string, string>)[lowerCaseName] || 'default';
    
    return <Icon name={iconName} />;
  };

export { Icon, ObjectIcon, ObjectIconMap };
export default Icon;