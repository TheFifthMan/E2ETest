Feature: Freebuf login testing
  In order to achieve my goals
  As a persona
  I want to be able to login with a Freebuf

  Scenario: Login testing
    Given I on the home page
    And I Click the login button and fill my information
    Then I login successful and redirect to index page

