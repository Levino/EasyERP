define([
    "text!templates/Persons/CreateTemplate.html",
    "collections/Companies/CompaniesCollection",
    "collections/Persons/PersonsCollection",
    "collections/Departments/DepartmentsCollection",
    "models/PersonsModel",
    "common"
],
    function (CreateTemplate, CompaniesCollection, PersonsCollection, DepartmentsCollection, PersonModel, common) {

        var CreateView = Backbone.View.extend({
            el: "#content-holder",
            contentType: "Persons",
            template: _.template(CreateTemplate),
            imageSrc: '',

            initialize: function (options) {
                _.bindAll(this, "saveItem", "render");
                this.model = new PersonModel();
                this.render();
            },
            
            events: {
                "mouseenter .avatar": "showEdit",
                "mouseleave .avatar": "hideEdit"
            },
            
            showEdit: function () {
                $(".upload").animate({
                    height: "20px",
                    display: "block"
                }, 250);

            },
            
            hideEdit: function () {
                $(".upload").animate({
                    height: "0px",
                    display: "block"
                }, 250);

            },
            
            saveItem: function () {
                var self = this;
                var mid = 39;

                var company = $('#companiesDd option:selected').val();
                var dateBirth = $(".dateBirth").val();
                var department = $("#departmentDd option:selected").val();
                var data = {
                    name: {
                        first: $.trim(this.$el.find('#firstName').val()),
                        last: $.trim(this.$el.find('#lastName').val())
                    },
                    imageSrc: this.imageSrc,
                    dateBirth: dateBirth,
                    company: company,
                    department: department,
                    address: {
                        street: $.trim($('#addressInput').val()),
                        city: $.trim($('#cityInput').val()),
                        state: $.trim($('#stateInput').val()),
                        zip: $.trim($('#zipInput').val()),
                        country: $.trim($('#countryInput').val())
                    },
                    website: $.trim($('#websiteInput').val()),
                    jobPosition: $.trim($('#jobPositionInput').val()),
                    skype: $.trim($('#skype').val()),
                    phones: {
                        phone: $.trim($('#phoneInput').val()),
                        mobile: $.trim($('#mobileInput').val()),
                        fax: $.trim($('#faxInput').val())
                    },
                    email: $.trim($('#emailInput').val()),
                    salesPurchases: {
                        isCustomer: $('#isCustomerInput').is(':checked'),
                        isSupplier: $('#isSupplierInput').is(':checked'),
                        active: $('#isActiveInput').is('checked')
                    }

                };

                var model = new PersonModel();
                model.save(data, {
                    headers: {
                        mid: mid
                    },
                    wait: true,
                    success: function (model) {
                        self.hideDialog();
                        Backbone.history.navigate("easyErp/Persons", { trigger: true });
                    },
                    error: function (model, xhr, options) {
                        if (xhr && xhr.status === 401) {
                            Backbone.history.navigate("login", { trigger: true });
                        } else {
                            Backbone.history.navigate("home", { trigger: true });
                        }
                    }
                });

            },
            hideDialog: function () {
                $(".create-person-dialog").remove();
            },

            render: function () {
                var formString = this.template({
                });
				var self = this;
                this.$el = $(formString).dialog({
                    autoOpen:true,
                    resizable:true,
					dialogClass:"create-person-dialog",
					title: "Edit Person",
					width:"80%",
                    buttons: [
                        {
                            text: "Create",
                            click: function () { self.saveItem(); }
                        },

						{
							text: "Cancel",
							click: function () { $(this).dialog().remove(); }
						}]

                });
                var personModel = new PersonModel();

                common.canvasDraw({ model: personModel.toJSON() }, this);
                //common.contentHolderHeightFixer();
                this.$el.find('.dateBirth').datepicker({
                    dateFormat: "d M, yy",
                    changeMonth: true,
                    changeYear: true,
                    yearRange: '-100y:c+nn',
                    maxDate: '-18y'
                });
                common.populateCompanies(App.ID.companiesDd, "/Companies");
                common.populateDepartments(App.ID.departmentDd, "/Departments");
                this.delegateEvents(this.events);


                return this;
            }

        });

        return CreateView;
    });
