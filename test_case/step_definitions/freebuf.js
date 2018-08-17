const assert = require('assert');

const I = actor();
// Add in your custom step files

Given('Open freebuf', () => {
  // TODO: replace with your own step
  I.amOnPage('/');
  I.waitForElement({xpath:'//*[@id="undefined-sticky-wrapper"]/div/div/div[1]/div[3]/div[2]/div/ul/li[1]/a/span'}, 30);
  I.see('登录');
});


Then('login', (demoPage) => {
  // From "features\lawPage.feature" {"line":73,"column":7}
  I.click({xpath:'//*[@id="undefined-sticky-wrapper"]/div/div/div[1]/div[3]/div[2]/div/ul/li[1]/a/span'});
  I.switchToNextTab();
  demoPage.Loginform('a403481704@163.com','Freebuf123');
  I.waitForElement({xpath:'//*[@id="undefined-sticky-wrapper"]/div/div/div[1]/div[3]/div[1]/div/ul/li[1]/a'},30);
});