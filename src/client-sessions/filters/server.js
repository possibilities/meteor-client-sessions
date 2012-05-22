ClientSessionFilters = {
  loadSession: function() {
    var arrayArguments = _.toArray(arguments);
    
    this.clientId = arrayArguments.shift();
    return arrayArguments;
  }
};
