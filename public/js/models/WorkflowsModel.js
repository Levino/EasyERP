﻿define([
    'common',
    'Validation'
],
function (common, Validation){
    var WorkflowsModel = Backbone.Model.extend({
        idAttribute: "_id",
        initialize: function(){

        	this.on('invalid', function(model, errors){
                if(errors.length > 0){
                    var msg = errors.join('\n');
                    alert(msg);
                }
            });
        },
        validate: function(attrs){
            var errors = [];

            Validation.checkNameField(errors, true, attrs.value[0].name);
            if (attrs.wName){
            	Validation.checkNameField(errors, true, attrs.wName);
        	}
            if(errors.length > 0)
                return errors;

        },
        defaults: {
            wId: '',
            name: '',
            value: []
        },

        urlRoot: function () {
            return "/Workflows";
        }
    });

    return WorkflowsModel;
});