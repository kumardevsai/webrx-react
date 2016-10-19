import * as wxr from '../../web.rx.react';

export interface ViewModelActivator {
  (state: any): any;
}

export interface ViewModelActivatorMap {
  [key: string]: ViewModelActivator;
}

export interface MenuMap {
  [key: string]: wxr.Components.IMenu;
}

export class RoutingMap {
  public static displayName = 'RoutingMap';

  public viewModelMap: ViewModelActivatorMap = {};
  public menuMap: MenuMap = {};

  constructor(private baseUri = '#/demo', private defaultIconName = 'flask') {
  }

  public addRoute(menuName: string, path: string, name: string, activator: ViewModelActivator, uri?: string, iconName?: string) {
    this.viewModelMap[path] = activator;
    const menu = this.menuMap[menuName] = this.menuMap[menuName] || <wxr.Components.IMenu>{
      id: menuName,
      header: `${menuName} Demos`,
      items: [],
    };
    menu.items.push(<wxr.Components.IMenuItem>{ id: path, header: name, uri: this.getUri(path, uri), iconName: iconName || this.defaultIconName, order: menu.items.length });
  }

  public getUri(path: string, uri: string) {
    return `${this.baseUri}/${uri || path}`;
  }

  public get menus() {
    return Object.getOwnPropertyNames(this.menuMap)
      .asEnumerable()
      .select(x => this.menuMap[x])
      .toArray();
  }
}

const routingMap = new RoutingMap();

const sampleListData = [
  { name: 'test 1', requiredBy: 'now' },
  { name: 'test 2', requiredBy: 'tomorrow' },
  { name: 'test 3', requiredBy: 'yesterday' },
  { name: 'test 4', requiredBy: 'test4' },
  { name: 'test 5', requiredBy: 'test5' },
  { name: 'test 6', requiredBy: 'test6' },
  { name: 'test 7', requiredBy: 'test7' },
  { name: 'test 8', requiredBy: 'test8' },
  { name: 'test 9', requiredBy: 'test9' },
  { name: 'test 10', requiredBy: 'test10' },
  { name: 'test 11', requiredBy: 'test11' },
];

const sampleTreeData = sampleListData
  .map(x => Object.assign({ items: sampleListData.slice(0, 3) }, x));

routingMap.addRoute('Framework', 'Loading', 'Loading', (state: any) => 'Loading');
routingMap.addRoute('Framework', 'SizedLoading', 'Sized Loading', (state: any) => 'SizedLoading');
routingMap.addRoute('Framework', 'Splash', 'Splash', (state: any) => 'Splash');
routingMap.addRoute('Framework', 'CommandButton', 'Command Button', (state: any) => 'CommandButton');
routingMap.addRoute('Framework', 'Alert', 'Alert', (state: any) => 'Alert');
routingMap.addRoute('Framework', 'TimeSpanInput', 'Time Span Input', (state: any) => new wxr.Components.TimeSpanInputViewModel(undefined, undefined, true));
routingMap.addRoute('Framework', 'ContextMenu', 'Context Menu', (state: any) => 'ContextMenu');
routingMap.addRoute('Framework', 'ProfilePicture', 'Profile Picture', (state: any) => 'ProfilePicture');
routingMap.addRoute('Framework', 'List', 'List', (state: any) => new wxr.Components.ListViewModel(sampleListData, true, false));
routingMap.addRoute('Framework', 'Tree', 'Tree', (state: any) => new wxr.Components.ListViewModel(sampleTreeData, true, false));
routingMap.addRoute('Framework', 'PanelList', 'Panel List', (state: any) => new wxr.Components.ListViewModel(sampleListData, true, false));
routingMap.addRoute('Framework', 'DataGrid', 'Data Grid', (state: any) => wxr.Components.DataGridViewModel.create(...sampleListData));
routingMap.addRoute('Framework', 'DataGridAutoCol', 'Data Grid (Automatic Columns)', (state: any) => wxr.Components.DataGridViewModel.create(...sampleListData));
routingMap.addRoute('Framework', 'DataGridList', 'DataGrid (List View)', (state: any) =>
  new wxr.Components.DataGridViewModel(sampleListData, (item, regex) => `${item.name} ${item.requiredBy}`.search(regex) >= 0)
);
routingMap.addRoute('Framework', 'ModalDialog', 'Modal Dialog', (state: any) => {
  const vm = new wxr.Components.ModalDialogViewModel('Modal Dialog Demo', 'Content...');

  Rx.Observable
    .merge(vm.accept.results.map(x => true), vm.cancel.results.map(x => false))
    .subscribe(x => wxr.Alert.create(`Modal ${x ? 'Accepted' : 'Cancelled'}`, 'Modal Closed...'));

  return vm;
});
routingMap.addRoute('Framework', 'Tabs', 'Tabs', (state: any) => new wxr.Components.TabsViewModel());

export const Default = routingMap;
