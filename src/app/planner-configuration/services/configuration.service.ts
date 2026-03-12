import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  public configurationValue: Subject<Record<string, number>> = new Subject();

  public setConfigurationValue(configuration: Record<string, number>) {
    this.configurationValue.next({...configuration});
  }

  public getConfiguration() {
    return this.configurationValue;
  }
}
