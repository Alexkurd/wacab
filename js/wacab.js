(function ($) {
$.storage = new $.store();

$.wa.errorHandler = function (xhr) {
	$.storage.del('site/' + $.wa.wacab.domain + '/hash');
	if (xhr.status == 404) {
		$.wa.setHash('#/');
		return false;
	}
	return true;
};

$.wa.wacab = {
	options: [],
	helper: '',
	dataTable: null,
	init: function (options) {

		this.options = options;

		var hash = window.location.hash || $.storage.get('wacab/hash');
		if (hash && hash != window.location.hash) {
			this.load_from_hash = 2;
			$.wa.setHash('#/' + hash);
		} else {
			this.dispatch();
		}

//		$("#wacab_servers_form").on('submit', function() {
			//console.log(this);
		//});

	},
	
	setHelper: function (helper) {
		if (helper === true) {
			return false;
		}
		if (helper) {
			this.helper = helper;
			$("#s-save-panel div.s-dropdown").show();
		} else {
			this.helper = '';
			$("#s-save-panel div.s-dropdown").hide();
		}
	},
	
	dispatch: function (hash) {
		if (hash == undefined) {
			hash = window.location.hash;
		}
		hash = hash.replace(/^[^#]*#\/*/, ''); /* fix sintax highlight*/
		if (hash) {
			hash = hash.split('/');
			if (hash[0]) {
				var actionName = "";
				var attrMarker = hash.length;
				for (var i = 0; i < hash.length; i++) {
					var h = hash[i];
					if (i < 2) {
						if (i === 0) {
							actionName = h;
						} else if (actionName == 'files') {
                            this.filesAction(hash.slice(i).join('/'));
							return;
						} else if (parseInt(h, 10) != h && h.indexOf('=') == -1 && actionName != 'plugins') {
							actionName += h.substr(0,1).toUpperCase() + h.substr(1);
						} else {
							attrMarker = i;
							break;
						}
					} else {
						attrMarker = i;
						break;
					}
				}
				var attr = hash.slice(attrMarker);

				if (this[actionName + 'Action']) {
					this[actionName + 'Action'].apply(this, attr);
					// save last page to return to by default later
					$.storage.set('site/' + this.domain + '/hash', hash.join('/'));					
				} else {
					if (console) {
						console.log('Invalid action name:', actionName+'Action');
					}
				}
			} else {
				this.defaultAction();
			}
		} else {
			this.defaultAction();
		}			
	},
			
	defaultAction: function () {
		var hash = $("div.sidebar ul.menu-v a:first").attr('href');
		$.wa.setHash(hash);
	},
	parserAction: function () {
		this.savePanel(false);
		$("#content").load('?module=parser', function () {
			$.wa.wacab.active($("#s-link-parser"));
		});
	},
	transactionsAction: function () {
		this.savePanel(false);
		$("#content").load('?module=transactions', function () {
			$.wa.wacab.active($("#s-link-transactions"));
		});
	},
	settingsAction: function () {
		//alert('settings');
		this.savePanel(false);
        $("#content").load('?module=settings', function () {
            $.wa.wacab.active($("#s-link-settings"));
        });
	},
	active: function (el) {
		$(".menu-li").removeClass('selected');
		if (el && el.length) {
			el.addClass('selected');
		}
	},
	savePanel: function (show, add_class) {
		if (show) {
			$("#s-save-panel").show();
			$("#s-save-panel input").removeClass('yellow').addClass('green');
			$("#wa-editor-status").empty();
			if (add_class) {
				$("#s-save-panel .s-bottom-fixed-bar-content-offset").addClass(add_class);
			} else {
				$("#s-save-panel .s-bottom-fixed-bar-content-offset").attr('class', 's-bottom-fixed-bar-content-offset');
			}
		} else {
			$("#s-save-panel").hide();
		}
	},
	saveServer: function(el) {
		var self = this;
		form = $(el);
		var data = form.serialize();
		$.get("?module=servers&action=save&" + data, function (response) {
			if(response.status == 'ok') {
				$('#wacab_servers_container').html(response.data.servers);
				$('#wacab_servers_form_container').html(response.data.form);
				$('#wacab_servers_form_savebutton').addClass('green');
			}
			else {
				$('#wacab_servers_form_savebutton').removeClass('green').addClass('red');
			}
		}, "json");
	},
	deleteServer: function(id) {
		$.post("?module=servers&action=delete", {id: id}, function (response) {
			if(response.status == 'ok') {
				$('#wacab_servers_container').html(response.data.template);
				$('#wacab_servers_form_savebutton').removeClass('green').removeClass('red');
			}
			else {
			}
		}, "json");
	},
	busyServer: function(id) {
		$.post("?module=servers&action=busy", {id: id}, function (response) {
			if(response.status == 'ok') {
				$('#wacab_servers_container').html(response.data.template);
				$('#wacab_servers_form_savebutton').removeClass('green').removeClass('red');
			}
			else {
			}
		}, "json");
	},
	editServer: function(id) {
		$.post("?module=servers&action=edit", {id: id}, function (response) {
			if(response.status == 'ok') {
				$('#wacab_servers_form_container').html(response.data.template);
				$('#wacab_servers_form_savebutton').removeClass('green').removeClass('red');
			}
			else {
			}
		}, "json");
	},
	saveSettings: function(el) {
		var self = this;
		form = $(el);
		var data = form.serialize();
		$.get("?module=settings&action=save&" + data, function (response) {
			if(response.status == 'ok') {
				$('#wacab_settings_form_savebutton').addClass('green');
			}
			else {
				$('#wacab_settings_form_savebutton').removeClass('green').addClass('red');
			}
		}, "json");
	},
	initDataTable: function() {
		var self = this;
		self.dataTable = $('#wacabTransactionsTable').dataTable({
			"processing": true,
			"serverSide": true,
			"order": [[ 0, "desc" ]],
			"stateSave": true,
			"pageLength": 50,
			"columns": [
				{ "data": "Date" },
				{ "data": "Before" },
				{ "data": "Pay" },
				{ "data": "After" },
				{ "data": "Order" },
				{ "data": "App" },
				{ "data": "Description" }
			],
			language: {
				"processing": "Подождите...",
				"search": "Поиск:",
				"lengthMenu": "Показать _MENU_ записей",
				"info": "Записи с _START_ до _END_ из _TOTAL_ записей",
				"infoEmpty": "Записи с 0 до 0 из 0 записей",
				"infoFiltered": "(отфильтровано из _MAX_ записей)",
				"infoPostFix": "",
				"loadingRecords": "Загрузка записей...",
				"zeroRecords": "Записи отсутствуют.",
				"emptyTable": "В таблице отсутствуют данные",
				"paginate":
				{

					"first": "Первая",
					"previous": "Предыдущая",
					"next": "Следующая",
					"last": "Последняя"

				},
				"aria":
				{

					"sortAscending": ": активировать для сортировки столбца по возрастанию",
					"sortDescending": ": активировать для сортировки столбца по убыванию"

				}
			},
			"ajax": '?module=gettable'
		});
	}
};
})(jQuery);
