import { OpenviduNg2ExamplePage } from './app.po';

describe('openvidu-ng2-example App', function() {
  let page: OpenviduNg2ExamplePage;

  beforeEach(() => {
    page = new OpenviduNg2ExamplePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
