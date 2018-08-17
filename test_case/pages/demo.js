
const I = actor();

module.exports = {

  // insert your locators and methods here
  fields: {
    email: {xpath:'//*[@id="username"]'},
    password:{xpath:'//*[@id="password"]'}
  },
  submitButton:{xpath:'//*[@id="loginBtn"]'},
  Loginform(email,password){
    I.fillField(this.fields.email,email);
    I.fillField(this.fields.password,password);
    I.click(this.submitButton);
  }
}
