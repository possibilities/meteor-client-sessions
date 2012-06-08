// Demo model

User = Model.extend({
  modelName: 'user',

  // User validation
  validate: {
    successMessage: "Great, you saved your name!",
    errorMessage: "Oh snap! Your name couldn't be saved!",
    inputs: {
      name: {
        validators: [
          shouldBePresent(),
          shouldBeShorterThan(100)
        ]
      }
    }
  },
});

// Demo form

var userForm = new InlineForm({
  name: 'user',
  modelClass: User,
  method: 'saveUser',
  noInputLabels: true,
  clearOnSuccess: false,
  headerTemplate: 'userFormHeader',
  inputs: [
    'name', {
      classes: 'input-large',
      placeholder: 'Your name!',
      as: 'actionText',
      action: {
        label: 'Do it!',
        classes: 'submit-action btn-primary'
      }
    }
  ]
});

// Configure demo

new Demo({
  hosts: {
    production: ['client-session.meteor.com']
  },
  github: {
    user: 'possibilities',
    repo: 'meteor-client-sessions'
  }
});
