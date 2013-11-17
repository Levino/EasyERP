/**
 * Created with JetBrains PhpStorm.
 * User: Ivan
 * Date: 13.11.13
 * Time: 11:28
 * To change this template use File | Settings | File Templates.
 */
define([
    'text!templates/Notes/NoteTemplate.html',
    'custom'

], function (NoteTemplate, Custom) {
    var NoteView = Backbone.View.extend({
        initialize: function() {
        },
        events: {
            "click #noteArea" : "expandNote",
            "click #cancelNote" : "cancelNote",
            "click #addNote" : "saveNote",
            "click .addTitle" : "showTitle",
            "click .editNote" : "editNote",
        },
		editNote : function(e){
			$(".title-wrapper").show();
			$("#noteArea").attr("placeholder","").parents(".addNote").addClass("active");
		},
		expandNote : function(e){
			if (!$(e.target).parents(".addNote").hasClass("active")){
				$(e.target).attr("placeholder","").parents(".addNote").addClass("active");
				$(".addTitle").show();
			}
        },
		cancelNote : function(e){
			$(e.target).parents(".addNote").find("#noteArea").attr("placeholder","Add a Note...").parents(".addNote").removeClass("active");
			$(".title-wrapper").hide();
			$(".addTitle").hide();
        },

		saveNote : function(e){
			if (!($(e.target).parents(".addNote").find("#noteArea").val()=="" && $(e.target).parents(".addNote").find("#noteTitleArea").val()=="")){
				$(e.target).parents(".addNote").find("#noteArea").attr("placeholder","Add a Note...").parents(".addNote").removeClass("active");
				$(".title-wrapper").hide();
				$(".addTitle").hide();
			}
			else{
				$(e.target).parents(".addNote").find("#noteArea").focus();
			}
        },

		 showTitle : function(e){
			$(e.target).hide().parents(".addNote").find(".title-wrapper").show().find("input").focus();
        },

        template: _.template(NoteTemplate),

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.delegateEvents(this.events);
            return this;
        }
    });

    return NoteView;
});