import {ClientID, UserID, Mobile_Auth, audioArray} from './conf.js'

var eventQueue = [];

startSocket()
function startSocket(){

	const PubSub = new WebSocket("wss://pubsub-edge.twitch.tv")

	PubSub.onmessage = function(event){
		event = JSON.parse(event.data)
		console.log(event)
		if (event.data != undefined){
			const message = JSON.parse(event.data.message)
			switch(event.data.topic.slice(0, -1 * (UserID.length+1))){
				case 'following':
					console.log("User followed: " + message.display_name)
					document.dispatchEvent(new CustomEvent('alert', {detail: {'UserID': message.user_id, 'eventType':'Has Followed The Channel'}}))
					break;
				case 'stream-chat-room-v1':
					if (message.data.target_channel_id == UserID){
						console.log("Host" + message.data.channel_login)
						document.dispatchEvent(new CustomEvent('alert', {detail: {'UserID': message.user_id, 'eventType':`Hosted With ${message.data.num_viewers} Viewers`}}))
					}
					break;
				case 'user-bits-events-v1': //Untested
					document.dispatchEvent(new CustomEvent('alert', {detail: {'UserID': message.user_id, 'eventType':message.data.chat_message}}))
					break;
				case 'user-subscribe-events-v1': //Untested
					const ret = (message.data.context == "sub") ? `Subscribed with ${message.data.sub_plan_name}` : `Resubbed as ${message.data.sub_plan_name} for ${message.data.months} months`
					document.dispatchEvent(new CustomEvent('alert', {detail: {'UserID': message.user_id, 'eventType':ret}}))
					break;
				default:
				console.log("Unhandled Function")
			}
		}
	}

	PubSub.onopen = function(event) {
		PubSub.send(JSON.stringify(
		{
			type: "LISTEN",
			data: {
				topics: ["user-subscribe-events-v1." + UserID,
				"chatrooms-user-v1." + UserID,
				"stream-chat-room-v1." + UserID,
				"channel-bits-events-v1." + UserID,
				"user-bits-updates-v1." + UserID,
				"following." + UserID,
				"chat_moderator_actions." + UserID,
				"chatrooms-channel-v1." + UserID],
				auth_token: Mobile_Auth
			}
		}
		))
		const PingPong = setInterval(PING, 1000 * 120)
		console.log('connected')
	}

	PubSub.onclose = function(event){
		clearInterval(PingPong)
		setTimeout(startSocket, 1000 * 3)
	}

	function PING(){
		PubSub.send(JSON.stringify({type:"PING"}))
	}
}

function preloadImage(url) {
	return new Promise(resolve =>{
		const img = new Image();
		fetch(url).then(function(response){
			return response.blob();
		}).then(function(blob) {
			img.src = URL.createObjectURL(blob);
			resolve(img.src);
		})
		
	})
}

document.addEventListener('alert', async function(e){
	await fetch('https://api.twitch.tv/kraken/channels/' + e.detail.UserID, { headers: ClientID }).then(function (response) {
		response.json().then(async function(json){
			const tempData = {
				'type': e.detail.eventType,
				'avatar': await preloadImage(json.logo.replace("300x300","70x70")),
				'background': (json.profile_banner != null) ? await preloadImage(json.profile_banner) : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAHgCAIAAADc1l95AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpEMkUwODI0Q0RDNDcxMUUyOUIxMUY4MjRFNkE4MDhDQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpEMkUwODI0RERDNDcxMUUyOUIxMUY4MjRFNkE4MDhDQSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkQyRTA4MjRBREM0NzExRTI5QjExRjgyNEU2QTgwOENBIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkQyRTA4MjRCREM0NzExRTI5QjExRjgyNEU2QTgwOENBIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+ft+iZwAACStJREFUeNrsnd1S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",
				'username': json.display_name
			};
			createPopup(tempData)
		})
	})
}, false);

function createPopup(eventItem) {
	const card = document.createElement('DIV');
	card.classList.add('card');
	card.classList.add('slide')
	card.style.background =  'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url("'+eventItem.background+'")'
	
	const avatar = document.createElement('IMG');
	avatar.classList.add('avatar')
	avatar.src = eventItem.avatar;
	card.appendChild(avatar);
	
	const text = document.createElement('DIV');
	text.classList.add('cardText');
	card.appendChild(text);

	const username = document.createElement('H4');
	username.innerText = eventItem.username;
	text.appendChild(username);
	
	const alertEvent = document.createElement('DIV');
	alertEvent.innerText = eventItem.type;
	text.appendChild(alertEvent);


	const audio = document.createElement('AUDIO');
	audio.autoplay = true;
	audio.volume = 0.5;
	audio.src = './audio/' + audioArray[Math.floor(Math.random() * audioArray.length)];
	audio.onended = function () {
		audio.remove();
	}

	card.appendChild(audio)

	document.getElementById('list').insertAdjacentElement('afterbegin', card);

	setTimeout(function () {
		card.classList.add('minicard')
		setTimeout(function() {
			card.classList.add('fadeout')
			setTimeout(function(){
				card.remove();
			}, 5000);
		}, 30000);
	}, 5000);

}