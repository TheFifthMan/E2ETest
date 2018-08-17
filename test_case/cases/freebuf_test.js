
Feature('Freebuf');

Scenario('open the freebuf and login form', (I,demoPage) => {
    I.amOnPage('/');
    I.waitForElement({xpath:'//*[@id="undefined-sticky-wrapper"]/div/div/div[1]/div[3]/div[2]/div/ul/li[1]/a/span'}, 30);
    I.see('登录');
    I.click({xpath:'//*[@id="undefined-sticky-wrapper"]/div/div/div[1]/div[3]/div[2]/div/ul/li[1]/a/span'});
    I.switchToNextTab();
    demoPage.Loginform('a403481704@163.com','Freebuf123');
    I.waitForElement({xpath:'//*[@id="undefined-sticky-wrapper"]/div/div/div[1]/div[3]/div[1]/div/ul/li[1]/a'},30);
});
