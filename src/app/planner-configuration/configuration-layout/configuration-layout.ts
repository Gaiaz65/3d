import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {InputNumberModule} from 'primeng/inputnumber';
import {TabPanel, TabPanels, Tabs} from 'primeng/tabs';

import {ConfigurationContextMenu} from '../components/configuration-context-menu';
import {ConfigurationUtilObjects} from '../components/configuration-util-objects';
import {ConfigurationMaterials} from '../components/configuration-materials';
import {ConfigurationForm} from '../components/configuration-form/configuration-form';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';

export enum EMenuItems {
  configuration = 'configuration',
  modules = 'modules',
  facades = 'facades',
}

export interface IConfigurationTab {
  label: string,
  value: EMenuItems,
  icon: string,
}

@Component({
  selector: 'app-configuration-layout',
  imports: [
    InputNumberModule,
    ConfigurationForm,
    ConfigurationContextMenu,
    ConfigurationUtilObjects,
    ConfigurationMaterials,
    Tabs,
    TabPanels,
    TabPanel,
    FormsModule,
    Button,
    Tooltip,
  ],
  providers: [],
  templateUrl: './configuration-layout.html',
  styleUrl: './configuration-layout.scss',
})
export class ConfigurationLayout {
  public EMenuItems = EMenuItems;
  public tabsValue = this.EMenuItems.modules;
  public tabs: IConfigurationTab[] = [
    {
      label: 'Конфигурация',
      value: EMenuItems.configuration,
      icon: 'pi pi-wrench',
    },
    {
      label: 'Модули',
      value:  EMenuItems.modules,
      icon: 'pi pi-box',
    },
    {
      label: 'Фасады',
      value: EMenuItems.facades,
      icon: 'pi pi-chart-pie',
    },
  ]

  public applyTab(value: EMenuItems): void {
    this.tabsValue = value;
  }
}
