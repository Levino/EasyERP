define([
    "text!templates/Departments/EditTemplate.html",
    "collections/Departments/DepartmentsCollection",
    "collections/Customers/AccountsDdCollection",
    "common",
    "custom",
	"populate"
],
    function (EditTemplate, DepartmentsCollection, AccountsDdCollection, common, Custom, populate) {

        var EditView = Backbone.View.extend({
            el: "#content-holder",
            contentType: "Departments",
            template: _.template(EditTemplate),
            initialize: function (options) {
                _.bindAll(this, "render", "saveItem");
                this.departmentsCollection = new DepartmentsCollection();
                _.bindAll(this, "render", "deleteItem");
				if (options.myModel){
					this.currentModel = options.myModel;
				}
				else{
					this.currentModel = (options.model) ? options.model : options.collection.getElement();
				}
				this.responseObj = {};
				this.page=1;
                this.render();
            },
			events:{
                'click .dialog-tabs a': 'changeTab',
                'click #sourceUsers li': 'addUsers',
                'click #targetUsers li': 'removeUsers',
                "click .current-selected": "showNewSelect",
                "click": "hideNewSelect",
				"click .prevUserList":"prevUserList",
				"click .nextUserList":"nextUserList",
                "click .newSelectList li:not(.miniStylePagination)": "chooseOption",
                "click .newSelectList li.miniStylePagination": "notHide",
                "click .newSelectList li.miniStylePagination .next:not(.disabled)": "nextSelect",
                "click .newSelectList li.miniStylePagination .prev:not(.disabled)": "prevSelect"
			},
            notHide: function (e) {
				return false;
            },

			nextSelect:function(e){
				this.showNewSelect(e,false,true)
			},
			prevSelect:function(e){
				this.showNewSelect(e,true,false)
			},

			nextUserList:function(e){
				this.page+=1;
				common.populateUsersForGroups('#sourceUsers','#targetUsers',null,this.page);
			},
			prevUserList:function(e){
				this.page-=1;
				common.populateUsersForGroups('#sourceUsers','#targetUsers',null,this.page);
			},

			chooseUser:function(e){
				$(e.target).toggleClass("choosen");
			},
            addUsers: function (e) {
                e.preventDefault();
                $('#targetUsers').append($(e.target));
            },
            removeUsers: function (e) {
                e.preventDefault();
                $('#sourceUsers').append($(e.target));
            },

			changeTab:function(e){
				$(e.target).closest(".dialog-tabs").find("a.active").removeClass("active");
				$(e.target).addClass("active");
				var n= $(e.target).parents(".dialog-tabs").find("li").index($(e.target).parent());
				$(".dialog-tabs-items").find(".dialog-tabs-item.active").removeClass("active");
				$(".dialog-tabs-items").find(".dialog-tabs-item").eq(n).addClass("active");
			},

			hideNewSelect:function(e){
				$(".newSelectList").hide();
			},
            showNewSelect:function(e,prev,next){
                populate.showSelect(e,prev,next,this);
                return false;
                
            },

			chooseOption:function(e){
                $(e.target).parents("dd").find(".current-selected").text($(e.target).text()).attr("data-id",$(e.target).attr("id")).attr("data-level",$(e.target).data("level"));
			},

            saveItem: function () {

                var self = this;
                var mid = 39;
                var departmentName = $.trim($("#departmentName").val());
                
                var parentDepartment = this.$("#parentDepartment").data("id")?this.$("#parentDepartment").data("id"):null;
				if (parentDepartment==""){
					parentDepartment = null;
				}

                var departmentManager = this.$("#departmentManager").data("id");
				if (departmentManager==""){
					departmentManager = null;
				}

                var nestingLevel = parseInt(this.$("#parentDepartment").data('level'))+1;
				if (!nestingLevel){
					nestingLevel=0;
				}
                var users = this.$el.find("#targetUsers li");
				var res = _.filter(this.responseObj["#parentDepartment"],function(item){
					return item.parentDepartment===parentDepartment;
				});
                users = _.map(users, function(elm) {
                    return $(elm).attr('id');
                });
                //var _departmentManager = common.toObject(managerId, this.accountDdCollection);
                //var departmentManager = {};
                //if (_departmentManager) {
                //    departmentManager.name = _departmentManager.name.first + " " + _departmentManager.name.last;
                //    departmentManager.id = _departmentManager._id;
                //} else {
                //    departmentManager = currentModel.defaults.departmentManager;
                //}

                this.currentModel.set({
                    departmentName: departmentName,
                    parentDepartment: parentDepartment,
                    departmentManager: departmentManager,
                    nestingLevel: nestingLevel,
                    users: users,
					isAllUpdate:nestingLevel!=this.currentModel.toJSON().nestingLevel,
					sequence:res.length
                });

                this.currentModel.save({}, {
                    headers: {
                        mid: mid
                    },
                    wait: true,
                    success: function (model) {
						self.hideDialog();
                        Backbone.history.navigate("#easyErp/Departments", { trigger: true });
                    },
                    error: function (model, xhr) {
                        self.hideDialog();
						if (xhr && (xhr.status === 401||xhr.status === 403)) {
							if (xhr.status === 401){
								Backbone.history.navigate("login", { trigger: true });
							}else{
								alert("You do not have permission to perform this action");								
							}
                        } else {
                            Backbone.history.navigate("home", { trigger: true });
                        }
                    }
                });

            },
            hideDialog: function () {
                $(".create-dialog").remove();
            },
            deleteItem: function(event) {
                var mid = 39;
                event.preventDefault();
                var self = this;
                    var answer = confirm("Realy DELETE items ?!");
                    if (answer == true) {
                        this.currentModel.destroy({
                            headers: {
                                mid: mid
                            },
                            success: function () {
                                $('.edit-dialog').remove();
                                Backbone.history.navigate("easyErp/" + self.contentType, { trigger: true });
                            },
                            error: function (model,err) {
								if (err.status===403){
									alert("You do not have permission to perform this action");
								}else{
									$('.edit-dialog').remove();
									Backbone.history.navigate("home", { trigger: true });
								}
                            }
                        });
                }
            },
            render: function () {
				console.log(this.currentModel.toJSON());
                var formString = this.template({
                    model: this.currentModel.toJSON(),
                });
				var self=this;
                this.$el = $(formString).dialog({
					closeOnEscape: false,
                    autoOpen: true,
                    resizable: false,
                    dialogClass: "edit-dialog",
                    width: "950px",
                    title: "Edit Department",
                    buttons: [{
								  text: "Save",
								  click: function () { self.saveItem(); }
							  },
							  {
								  text: "Cancel",
								  click: function () { $(this).remove(); }
							  },
							  {
								  text: "Delete",
								  click:self.deleteItem 
							  }]
                });
/*				common.populateDepartments(App.ID.parentDepartment, "/getDepartmentsForEditDd", this.currentModel.toJSON(),function(){self.styleSelect(App.ID.parentDepartment);} );
                common.populateEmployeesDd(App.ID.departmentManager, "/getPersonsForDd", this.currentModel.toJSON(),function(){self.styleSelect(App.ID.departmentManager);});*/
				populate.get2name("#departmentManager", "/getPersonsForDd",{},this,false,true);
				populate.getParrentDepartment("#parentDepartment", "/getDepartmentsForEditDd",{id:this.currentModel.toJSON()._id},this, false, true);

				var k=this.currentModel.toJSON().users;
				var b=$.map(this.currentModel.toJSON().users, function (item) {
                    return $('<li/>').text(item.login).attr("id",item._id);
                });
				$('#targetUsers').append(b);
				common.populateUsersForGroups('#sourceUsers','#targetUsers',this.currentModel.toJSON(),this.page);
                return this;
            }

        });

        return EditView;
    });
