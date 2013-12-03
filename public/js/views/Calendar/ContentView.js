define([
    "text!templates/Calendar/CalendarTemplate.html",
    "text!templates/Calendar/AddCalendarDialogTemplate.html",
    "text!templates/Calendar/SyncDialog.html",
    "Calendar",
    "collections/Events/EventsCollection",
    "collections/Calendar/CalendarCollection",
    "common" ,
    "models/EventModel",
    "models/CalendarModel",
    "GoogleAuth",
    "dataService"
],
function (CalendarTemplate, AddCalendarDialogTemplate, SyncDialog, Calendar, EventsCollection, CalendarsCollection, common, EventModel, CalendarModel, GoogleAuth, dataService) {
    var ContentView = Backbone.View.extend({
        el: '#content-holder',
        template: _.template(CalendarTemplate),
        syncDilalogTpl: _.template(SyncDialog),
        createDlgTpl: _.template(AddCalendarDialogTemplate),

        initialize: function () {
            _.bindAll(this, 'syncDlgSubmitBtnClickHandler', 'displayEventsOnCalendar', 'createNewCalendar');
            this.eventsCollection = new EventsCollection();
            this.calendarsCollection = new CalendarsCollection();
            this.eventsCollection.bind('reset', _.bind(this.curCalendarChange, this));
            this.calendarsCollection.bind('reset', _.bind(this.populateCalendarsList, this));
			this.render();
        },

        events: {
            "click #authBtn" : "authorize",
            "click #addCalendarBtn" : "openCreateCalendarDlg",
            "change #calendarList" : "curCalendarChange"
        },

        hideDialog: function(){
            $('#addCalendarDlg').remove();
        },

        createNewCalendar: function(data){
            var self = this;
            this.calendarsCollection.create({
                summary: data,
                description: "EasyERP calendar events",
                events: []
            },{
                success:function(){
                    self.calendarsCollection.fetch({
                        success: function(){
                            self.populateCalendarsList();
                        }
                    });
                }
            });
        },

        openCreateCalendarDlg: function(){
            var self = this;
            var formString =  this.createDlgTpl();
            var dialog = $(formString).dialog({
                title: "Create Calendar",
                dialogClass: "edit-dialog",
                buttons:{
                    create:{
                        text: "Create",
                        click: function(){
                            var calName = $('#calendarNameTxt').val();
                            if(calName.length === 0){
                                alert('Calendar name can not be empty!');
                                return;
                            }
                            self.createNewCalendar(calName);
                            self.hideDialog();
                        }
                    },
                    cancel:{
                        text: "Cancel",
                        click:self.hideDialog
                    }

                }
            });
        },

        curCalendarChange: function(){
            var curCalendarId = $('#calendarList option:selected').val();
            this.setCurrentCalendarId(curCalendarId);
            var filtered = this.eventsCollection.filterById([curCalendarId]);
            console.log("Filtered Collection :" + filtered.length);
            this.displayEventsOnCalendar(filtered);
        },

        closeSyncDialog: function(){
            $('#syncDialog').remove();
        },

        populateCalendarsList: function(){
            if(this.calendarsCollection.length > 0){
                var select = $('#calendarList');
                var options = $.map(this.calendarsCollection.toJSON(), function(item){
                    return item.summary === "EasyERP" ? $('<option/>').val(item._id).text(item.summary).attr('selected', 'selected') :
                        $('<option/>').val(item._id).text(item.summary);
                });
                select.empty().append(options);
                this.curCalendarChange();
                return;
            }
        },
        setCurrentCalendarId: function(id){
            App.Calendar.currentCalendarId = id;
        },
        getCurrentCalendarId: function(){
            return App.Calendar.currentCalendarId;
        },

        displayEventsOnCalendar: function(events){
            Calendar.loadCalendarEvents(events);
        },

        syncDlgSubmitBtnClickHandler:function(){
            this.parseSelectedCalendars();
            this.loadCalendarEvents();
        },

        showSyncDialog: function(calendars){
            var formString = this.syncDilalogTpl({calendarsCollection:calendars});
            this.syncDialog = $(formString).dialog({
                autoOpen:true,
                resizable:false,
                title: "Synchronize calendars",
                buttons:{
                    submit: {
                        text:"Continue",
                        click: this.syncDlgSubmitBtnClickHandler
                    },
                    cancel: {
                        text: "Cancel",
                        click: this.closeSyncDialog
                    }
                }
            });
        },

        authorize: function(){
            var self = this;
            GoogleAuth.Authorize(function(){
                GoogleAuth.GetCalendarsList(function(resp){
                    var calendarList = resp;
                    if(calendarList.length > 0){
                        self.showSyncDialog(calendarList);
                        //common.deleteFromLocalStorage('token');
                        common.deleteFromLocalStorage('calendars');
                        common.saveToLocalStorage('calendars', JSON.stringify(calendarList));
                    }
                });
            });
        },

        parseSelectedCalendars: function(){
            var checkboxes = $('input:checkbox[name=calendarSelect]:checked');
            if(checkboxes.length == 0){
                alert('Please select calendars to synchronize');
                return;
            }
            var calendarIdList = $.map(checkboxes,function(item){
                return $(item).attr('data-id');
            });
            var self = this;
            var calendarsJSON = JSON.parse(common.getFromLocalStorage("calendars"));
            var array = [];
            for(var i = 0; i < calendarsJSON.length; i++){
                for(var j = 0; j < calendarIdList.length; j++){
                    if(calendarsJSON[i].id == calendarIdList[j]){
                        array.push(calendarsJSON[i]);
                    }
                }
            }
            common.saveToLocalStorage('calendars', JSON.stringify(array));
        },

        loadCalendarEvents : function(){
            var calendarsJSON = JSON.parse(common.getFromLocalStorage('calendars'));
            var calendarIdList = $.map(calendarsJSON, function(item){
                return item.id;
            });
            var counter = 0;
            var self = this;
            GoogleAuth.LoadCalendarEvents(calendarIdList, function(resp, calendarId){
                counter++;
                if(resp){
                    _.each(calendarsJSON, function(item){
                        if(item.id == calendarId){
                            item.items = resp.items;
                        }
                    });

                } else {
                    if(resp.error) console.log('Error occured: ' + resp.error);
                }
                if(counter == calendarIdList.length){
                    dataService.postData("/GoogleCalSync", {mid:39, calendars:calendarsJSON}, function(resp){
                        console.log(resp);
                    });
                    self.clearLocalStorage();
                }

            });
            this.closeSyncDialog();
        },

        clearLocalStorage: function(){
            common.deleteFromLocalStorage('calendars');
            common.deleteFromLocalStorage('token');
        },

        saveCalendarsToDB: function(calendarArray){
            _.each(calendarArray, function(item){
                var cal = new CalendarModel();
                cal.save(item,{
                    headers: { mid: 39 },
                    success: function(){ console.log('saved calendar'); }
                });
            });
            this.populateCalendarsList();
        },
        saveEventsToDB: function(eventsArray, calendarId){
            var self = this;
            if(eventsArray && eventsArray.length > 0){
                this.mockFunc = _.after(eventsArray.length, function(){
                    self.eventsCollection.fetch({
                        data: $.param({
                            mid: 39
                        }),
                        reset: true
                    });
                });
                _.each(eventsArray, function(item){
                    var event = new EventModel({
                        summary: item.summary,
                        id: item.id,
                        status: item.status,
                        description: item.description,
                        start_date: item.start.dateTime,
                        end_date: item.end.dateTime,
                        calendarId: calendarId
                    });
                    event.save({},{
                        headers: { mid: 39 },
                        success: function(){
                            console.log('saved events');
                            self.mockFunc();
                        }
                    });
                });
            }
            this.closeSyncDialog();
        },

        mockFunc: function(){
            console.log('mock');
        },

        render: function () {
            console.log('Render Calendar');
            this.$el.html(this.template());
            Calendar.initCalendar("schedulerDiv", this.eventsCollection);
            Calendar.initMiniCalendar("miniCalendar");
            return this;
        }
    });

    return ContentView;
});
