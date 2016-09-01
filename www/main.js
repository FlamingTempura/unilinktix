/* global $ */
'use strict';

var statusLabels = {
	expired: 'Expired',
	ready: 'Ready to be activated',
	active: 'Active'
};

var parseTickets = function (body) {
	var d = $($.parseHTML(body));
	return d.find('.box').map(function () {
		var $box = $(this),
			statusText = $box.find('.box_mid').find('h4').eq(1).text(),
			title = $box.find('h3').eq(0).text(),
			detail = $box.find('.detail').text(),
			issuedMatch = detail.match(/issue date:\s*([0-9]{2}\-[a-z]{3}\-[0-9]{2})/i),
			expiredMatch = detail.match(/(?:used by|expiry date):\s*([0-9]{2}\-[a-z]{3}\-[0-9]{2})/i),
			remainingMatch = detail.match(/remaining:\s*([0-9]+)/i),
			costMatch = detail.match(/value:\s*(£[0-9]+\.[0-9]+)/i);
		return {
			title: title,
			status: statusText.toLowerCase().indexOf('expired') > -1 ? 'expired' :
					statusText.toLowerCase().indexOf('update available') > -1 ? 'ready' : 'active',
			issued: issuedMatch ? issuedMatch[1] : null,
			expires: expiredMatch ? expiredMatch[1] : null,
			remaining: remainingMatch ? Number(remainingMatch[1]) : null,
			cost: costMatch ? costMatch[1] : null,
		};
	}).get();
};

var showLogin = function (err) {
	if (err) {
		$('.error').show().text('Could not retrieve tickets. ' + (err.message || ''));
	} else {
		$('.error').hide();
	}
	$('#username').val(localStorage.getItem('username'));
	$('#password').val(localStorage.getItem('password'));
	$('#loginform').show().siblings().hide();
};

var showError = function (err) {
	if (err.status <= 0) { err.message = 'No internet connection.'; }
	$('#error .message').text(err.message);
	$('#error').show().siblings().hide();
};

var login = function () {
	return $.post({
		url: 'https://key.unilinkbus.co.uk/smart-card/login/',
		data: {
			customerUsername: localStorage.getItem('username') || '',
			customerPassword: localStorage.getItem('password') || '',
			login: 1
		}
	}).then(function (body) {
		if (body.indexOf('errors in your submission') > -1) {
			throw { message: 'Email or password incorrect.' };
		}
	}).catch(showLogin);
};

var showTickets = function (permitLogin) {
	return $.get('https://key.unilinkbus.co.uk/smart-card/tickets/').then(function (body) {
		if (body.indexOf('Forgotten password?') > -1) { throw { message: 'Logged out' }; }
		$('.expired-tickets, .active-tickets').html('');
		parseTickets(body).forEach(function (ticket) {
			var $ticket = $('<div class="ticket">');
			$ticket.append('<div class="title">' + ticket.title + '</div>');
			$ticket.append('<div class="status ' + ticket.status + '">' + statusLabels[ticket.status] + '</div>');
			if (ticket.remaining !== null) { $ticket.append('<div class="remaining"><div class="number">' + ticket.remaining + '</div><div class="lbl">passes remaining</div></div>'); }
			if (ticket.cost !== null) { $ticket.append('<div class="cost">Cost: ' + ticket.cost + '</div>'); }
			$(ticket.status === 'expired' ? '.expired-tickets' : '.active-tickets').append($ticket);
			$ticket.append('<div class="issued">Issued ' + ticket.issued + (ticket.expires ? '. Expires ' + ticket.expires : '') + '.</div>');
		});
		$('#tickets').show().siblings().hide();
	}).catch(function (err) {
		if (err.message === 'Logged out') {
			if (permitLogin) {
				return login().then(function () {
					return showTickets();
				});	
			}
			return showLogin(err);
		}
		return showError(err);
	});
};

var init = function () {
	if (localStorage.getItem('username')) {
		showTickets(true);
	} else {
		showLogin();
	}

	$('#loginform').on('submit', function (e) {
		e.preventDefault();
		$('#loginfields').prop('disabled', true);
		localStorage.setItem('username', $('#username').val());
		localStorage.setItem('password', $('#password').val());
		login().then(function () {
			return showTickets();
		}).then(function () {
			$('#loginfields').prop('disabled', false);
		});
	});

	$('#logout').on('click', function () {
		localStorage.removeItem('username');
		localStorage.removeItem('password');
		showLogin();
	});

	$('#login').on('click', function () { showLogin(); });

	$('#retry').on('click', function () { showTickets(true); });

	$('#github').on('click', function () {
		navigator.app.loadUrl('https://github.com/FlamingTempura/unilinktix', { openExternal: true });
	});

	$(document).on('resume', function () {
		if ($('#tickets').is(':visible')) { showTickets(); }
	});
};

if (window.cordova) {
	$(document).on('deviceready', init);
} else {
	$(document).ready(init);
}