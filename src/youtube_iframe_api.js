


var Youtube = (function () {
	"use strict";

	// Version info
	var version_info = [ 1 , 0 , 1 ];



	// Helper functions
	var bind_function = function (callback, self) {
		var args = Array.prototype.slice.call(arguments, 2);

		// return callback.bind(self, args);
		return function () {
			var full_args = Array.prototype.slice.call(args);
			Array.prototype.push.apply(full_args, arguments);

			return callback.apply(self, full_args);
		};
	};
	var add_event_listener = function (event_list, node, event, callback, capture) {
		node.addEventListener(event, callback, capture);
		event_list.push([ node , event , callback , capture ]);
	};
	var remove_event_listeners = function (event_list) {
		for (var i = 0, entry; i < event_list.length; ++i) {
			entry = event_list[i];
			entry[0].removeEventListener(entry[1], entry[2], entry[3]);
		}
	};

	var support_check = function () {
		return (window.postMessage ? true : false);
	};



	// Player class
	var Player = (function () {

		// Class constructor
		var Player = function (settings) {
			var url, k, v;

			// State vars
			this.muted = false;
			this.volume = 100;
			this.player_state = -1;
			this.current_time = 0.0;
			this.duration = 0.0;
			this.video_data = null;
			this.loaded_fraction = 0.0;
			this.playback_quality = "";
			this.playback_qualities_available = [];
			this.playback_rate = 1.0;
			this.playback_rates_available = [];
			this.video_url = "";
			this.playlist = null;
			this.playlist_index = -1;
			this.extended_api = {};

			// Other vars
			this.id = next_player_id++;
			this.node_events = [];
			this.events = {};
			this.events_queued = {}; // contains events that will be hooked when onReady is received
			this.listening_interval = null;

			// Setup iframe
			this.iframe = document.createElement("iframe");
			this.iframe.setAttribute("frameborder", "0");

			// URL
			this.url_target = ("https" in settings && !settings.https ? "http:" : "https:") + "//www.youtube.com";

			url = this.url_target + "/embed"
			if ("video_id" in settings) url += "/" + settings.video_id;
			url += "?enablejsapi=1";

			if ("params" in settings) {
				for (k in settings.params) {
					v = settings.params[k];

					url += "&";
					url += k;
					if (v !== null) {
						url += "=";
						url += settings.params[k];
					}
				}
			}
			this.iframe.setAttribute("src", url);

			// Events
			add_event_listener(this.node_events, window, "message", bind_function(on_window_message, this), false);
			add_event_listener(this.node_events, this.iframe, "load", bind_function(on_iframe_load, this), false);

			// Custom events
			if ("on" in settings) {
				for (k in settings.on) {
					this.on(k, settings.on[k]);
				}
			}
		};



		// Constants
		Player.UNSTARTED = -1;
		Player.ENDED = 0;
		Player.PLAYING = 1;
		Player.PAUSED = 2;
		Player.BUFFERING = 3;
		Player.CUED = 5;



		// Private variables
		var next_player_id = 0;
		var event_map_native = {
			yt_state_change: "onStateChange",
			yt_playback_quality_change: "onPlaybackQualityChange",
			yt_playback_rate_change: "onPlaybackRateChange",
			yt_api_change: "onApiChange",
			yt_error: "onError",
		};
		var event_map_custom = {
			state_change: [ "player_state" ],
			volume_change: [ "volume", "muted" ],
			time_change: [ "current_time" ],
			duration_change: [ "duration" ],
			progress: [ "loaded_fraction" ],
			video_data_change: [ "video_data" ],
			playback_quality_change: [ "playback_quality" ],
			playback_rate_change: [ "playback_rate" ],
			playback_qualities_available_change: [ "playback_qualities_available" ],
			playback_rates_available_change: [ "playback_rates_available" ],
			playlist_change: [ "playlist" ],
			playlist_index_change: [ "playlist_index" ],
			api_change: [ "extended_api" ],
		};
		var event_map_native_reversed = (function () {
			var ret = {},
				i;

			for (i in event_map_native) {
				ret[event_map_native[i]] = i;
			}

			return ret;
		})();
		var player_vars_events = (function () {
			// Create a new mapping for faster access
			var ret = {},
				event, vars, i;

			for (event in event_map_custom) {
				vars = event_map_custom[event];
				for (i = 0; i < vars.length; ++i) {
					ret[vars[i]] = event;
				}
			}

			return ret;
		})();
		var player_vars_rename_map = {
			muted: "muted",
			volume: "volume",
			playerState: "player_state",
			currentTime: "current_time",
			duration: "duration",
			videoData: "video_data",
			videoLoadedFraction: "loaded_fraction",
			playbackQuality: "playback_quality",
			availableQualityLevels: "playback_qualities_available",
			playbackRate: "playback_rate",
			availablePlaybackRates: "playback_rates_available",
			videoUrl: "video_url",
			playlist: "playlist",
			playlistIndex: "playlist_index",
		};



		// Private functions
		function deep_compare(x, y) {
			// Deep comparison of some basic object types that can be JSON'ified: numbers (no inf/NaN), strings, nulls, arrays, and objects
			var a = typeof(x),
				i;

			if (a == typeof(y)) {
				if (a == "object") {
					// Null check
					if (x === null) {
						// Same if y also is null
						return (y === null);
					}
					else if (y === null) {
						// x is not null
						return false;
					}
					else if (Array.isArray(x)) {
						// If y is not an array, mismatch; if lengths mismatch, also not the same
						if (!Array.isArray(y) || x.length != y.length) return false;

						for (i = 0; i < x.length; ++i) {
							// Different
							if (!deep_compare(x[i], y[i])) return false;
						}

						// Same
						return true;
					}
					else if (Array.isArray(y)) {
						// x is not an array
						return false;
					}
					else {
						// Both are generic objects
						for (i in x) {
							// Key must exist in other; entries must also match
							if (!(i in y) || !deep_compare(x[i], y[i])) return false;
						}
						for (i in y) {
							// Key must exist in other
							if (!(i in x)) return false;
						}

						// Same
						return true;
					}
				}
				else {
					// Same type (note: this will fail for NaN == NaN; this shouldn't need checking anyway)
					return (x == y);
				}
			}

			// Different
			return false;
		};

		var process_initial_delivery = function (data) {
			// Check info
			var info = data.info;

			// Update variables
			if (info && typeof(info) === "object") {
				update_info.call(this, info, true);
			}
		};
		var process_info_delivery = function (data) {
			// Check info
			var info = data.info;

			// Update variables
			if (info && typeof(info) === "object") {
				update_info.call(this, info, false);
			}
		};
		var process_api_info_delivery = function (data) {
			var info = data.info,
				namespaces = info.namespaces,
				new_api = {},
				new_api_module, options, options_names, event_name, list, i, j;

			for (i = 0; i < namespaces.length; ++i) {
				options = info[namespaces[i]];
				options_names = options.options;

				new_api_module = {};
				new_api[namespaces[i]] = new_api_module;
				for (j = 0; j < options_names.length; ++j) {
					new_api_module[options_names[j]] = options[options_names[j]];
				}
			}

			// Check for difference
			if (!deep_compare(this.extended_api, new_api)) {
				var event_name = "api_change",
					pre = this.extended_api,
					event_data, list;

				// Update
				this.extended_api = new_api;

				// Check for listeners
				if (event_name in this.events && (list = this.events[event_name]).length > 0) {
					// Trigger event
					event_data = {
						current: {
							extended_api: this.extended_api,
						},
						previous: {
							extended_api: pre,
						},
					};

					// Trigger event
					for (i = 0; i < list.length; ++i) {
						list[i].call(this, event_data);
					}
				}
			}
		};
		var process_on_ready = function (data) {
			// Clear interval
			if (this.listening_interval !== null) {
				clearInterval(this.listening_interval);
				this.listening_interval = null;
			}

			// Re-bind events properly
			var events_map = this.events_queued,
				list, e, i;

			this.events_queued = null;

			for (e in events_map) {
				list = events_map[e];
				for (i = 0; i < list.length; ++i) {
					on_private.call(this, e, list[i], false);
				}
			}
		};
		var process_event = function (data) {
			// Generic event
			var event = data.event,
				event_data, list, i;

			// Update variables
			if (event && typeof(event) === "string" && event in event_map_native_reversed) {
				event = event_map_native_reversed[event];

				// Check if there are any listeners
				if (event in this.events && (list = this.events[event]).length > 0) {
					// Setup event
					event_data = {
						value: data.info,
					};

					// Trigger
					for (i = 0; i < list.length; ++i) {
						list[i].call(this, event_data);
					}
				}
			}
		};
		var update_info = function (info, initial) {
			var previous = {},
				events_performed, event_name, event_vars, event_data, list, v, i, p;

			// Variable differences
			for (v in info) {
				if (v in player_vars_rename_map) {
					i = info[v];
					v = player_vars_rename_map[v];
					p = this[v];

					// Check if differ
					if (!deep_compare(p, i)) {
						// Update
						previous[v] = p;
						this[v] = i;
					}
				}
			}

			// Initial change should not trigger events
			if (initial) return;

			// Change events
			events_performed = {};
			for (p in previous) {
				// Check event
				if (!(p in player_vars_events)) continue; // No event for this var
				event_name = player_vars_events[p];
				if (event_name in events_performed) continue; // Already triggered
				events_performed[event_name] = true;

				// Check if there are any listeners
				if (!(event_name in this.events) || (list = this.events[event_name]).length == 0) continue; // No listeners

				// Perform
				event_data = {
					current: {},
					previous: {},
				};

				event_vars = event_map_custom[event_name];
				for (i = 0; i < event_vars.length; ++i) {
					v = event_vars[i];
					event_data.current[v] = this[v];
					event_data.previous[v] = (v in previous) ? previous[v] : this[v];
				}

				// Trigger event
				for (i = 0; i < list.length; ++i) {
					list[i].call(this, event_data);
				}
			}
		};

		var send_message = function (message) {
			this.iframe.contentWindow.postMessage(JSON.stringify(message), this.url_target);
		};
		var send_command = function (command, args) {
			send_message.call(this, {
				event: "command",
				func: command,
				args: args,
				id: this.id,
			});
		};

		var on_window_message = function (event) {
			if (event.source === this.iframe.contentWindow) {
				// Get the event data
				var data;

				try {
					data = JSON.parse(event.data);
				}
				catch (e) {
					// Error (shouldn't happen)
					return;
				}

				// Process it
				if (data !== null && typeof(data) === "object") {
					if ("event" in data && data.event in auto_process_events) {
						auto_process_events[data.event].call(this, data);
						return;
					}

					// Standard event
					process_event.call(this, data);
				}
			}
		};
		var on_iframe_load = function (event) {
			// Begin listening for events
			on_listening_interval.call(this);
			if (this.listening_interval !== null) clearInterval(this.listening_interval);
			this.listening_interval = setInterval(bind_function(on_listening_interval, this), 250); // Interval is needed for IE
		};

		var on_listening_interval = function () {
			// Listen for events
			send_message.call(this, {
				event: "listening",
				id: this.id,
			});
		};

		var auto_process_events = {
			initialDelivery: process_initial_delivery,
			infoDelivery: process_info_delivery,
			apiInfoDelivery: process_api_info_delivery,
			onReady: process_on_ready,
		};

		var on_private = function (event_name, callback, immediate) {
			if (this.events_queued === null) {
				if (event_name == "ready") {
					// Ready event, call immediately
					callback.call(this, {
						immediate: immediate
					});
				}
				else if (event_name in event_map_native) {
					// Add a new event
					if (event_name in this.events) {
						// Add
						this.events[event_name].push(callback);
					}
					else {
						// Set
						this.events[event_name] = [ callback ];

						// Hook
						send_command.call(this, "addEventListener", [ event_map_native[event_name] ]);
					}
				}
				else if (event_name in event_map_custom) {
					// Add a new event
					if (event_name in this.events) {
						// Add
						this.events[event_name].push(callback);
					}
					else {
						// Set
						this.events[event_name] = [ callback ];
					}
				}
				else {
					// Invalid event
					return false;
				}
			}
			else {
				var e_list = (event_name in event_map_custom) ? this.events : this.events_queued;

				// Add a new event
				if (event_name in e_list) {
					// Add
					e_list[event_name].push(callback);
				}
				else {
					// Set
					e_list[event_name] = [ callback ];
				}
			}

			// Okay
			return true;
		};



		// Public functions
		Player.prototype = {
			constructor: Player,

			destroy: function () {
				// Remove events
				remove_event_listeners(this.node_events);
				this.node_events = null;

				// Remove node
				var par = this.iframe.parentNode;
				if (par) par.removeChild(this.iframe);
			},

			get_iframe: function () {
				return this.iframe;
			},

			on: function (event_name, callback) {
				return on_private.call(this, event_name, callback, true);
			},
			off: function (event_name, callback) {
				var events_map = (this.events_queued === null ? this.events : this.events_queued);

				if (event_name in events_map) {
					var list = events_map[event_name],
						i;

					for (i = 0; i < list.length; ++i) {
						if (list[i] === callback) {
							// Found
							list.splice(i, 1);
							return true;
						}
					}
				}

				// Not found
				return false;
			},

			play: function () {
				// Send event
				send_command.call(this, "playVideo", []);
			},
			pause: function () {
				// Send event
				send_command.call(this, "pauseVideo", []);
			},
			stop: function () {
				// Send event
				send_command.call(this, "stopVideo", []);
			},
			clear: function () {
				// Send event
				send_command.call(this, "clearVideo", []);
			},

			mute: function () {
				// Send event
				send_command.call(this, "mute", []);
			},
			unmute: function () {
				// Send event
				send_command.call(this, "unMute", []);
			},

			seek: function (timecode, allow_seek_ahead) {
				// Send event
				send_command.call(this, "seekTo", [ timecode , allow_seek_ahead ]);
			},

			goto_next: function () {
				// Send event
				send_command.call(this, "nextVideo", []);
			},
			goto_previous: function () {
				// Send event
				send_command.call(this, "previousVideo", []);
			},
			goto_at: function (index) {
				// Send event
				send_command.call(this, "playVideoAt", [ index ]);
			},

			load_video: function (video_id, autoplay, quality, start_time, end_time) {
				// Create event
				var args = {
					videoId: video_id,
				};
				if (quality != null) args["suggestedQuality"] = quality;
				if (start_time != null) args["startSeconds"] = start_time;
				if (end_time != null) args["endSeconds"] = end_time;

				// Send
				send_command.call(this, (autoplay ? "loadVideoById" : "cueVideoById"), [ args ]);
			},
			load_video_from_url: function (video_url, autoplay, quality, start_time, end_time) {
				// Create event
				var args = {
					mediaContentUrl: video_url,
				};
				if (quality != null) args["suggestedQuality"] = quality;
				if (start_time != null) args["startSeconds"] = start_time;
				if (end_time != null) args["endSeconds"] = end_time;

				// Send
				send_command.call(this, (autoplay ? "loadVideoByUrl" : "cueVideoByUrl"), [ args ]);
			},
			load_playlist: function (playlist, type, index, autoplay, quality, start_time) {
				// Create event
				var args;

				// Setup args
				if (Array.isArray(playlist)) {
					// Custom playlist
					args = [
						playlist,
						index != null ? index : 0,
						start_time != null ? start_time : 0,
					];
					if (quality != null) args.push(quality);
				}
				else {
					// Pre-existing playlist, or other
					args = {
						list: playlist,
					};

					if (
						type != null &&
						(
							type == "playlist" ||
							type == "search" ||
							type == "user_uploads"
						)
					) {
						args["listType"] = type;
					}
					if (index != null) args["index"] = index;
					if (quality != null) args["suggestedQuality"] = quality;
					if (start_time != null) args["startSeconds"] = start_time;

					args = [ args ];
				}

				// Send
				send_command.call(this, (autoplay ? "loadPlaylist" : "cuePlaylist"), args);
			},

			is_ready: function () {
				return (this.events_queued === null);
			},

			set_volume: function (volume) {
				// Send event
				send_command.call(this, "setVolume", [ volume ]);
			},
			get_volume: function () {
				return this.volume;
			},
			is_muted: function () {
				return this.muted;
			},

			set_playback_rate: function (rate) {
				// Send event
				send_command.call(this, "setPlaybackRate", [ rate ]);
			},
			get_playback_rate: function () {
				return this.playback_rate;
			},
			get_playback_rates_available: function () {
				return this.playback_rates_available;
			},

			set_playback_quality: function (quality) {
				// Send event
				send_command.call(this, "setPlaybackQuality", [ quality ]);
			},
			get_playback_quality: function () {
				return this.playback_quality;
			},
			get_playback_qualities_available: function () {
				return this.playback_qualities_available;
			},

			set_loop: function (loop_playlist) {
				// Send event
				send_command.call(this, "setLoop", [ loop_playlist ]);
			},
			set_shuffle: function (shuffle_playlist) {
				// Send event
				send_command.call(this, "setShuffle", [ shuffle_playlist ]);
			},

			get_loaded_fraction: function () {
				return this.loaded_fraction;
			},
			get_player_state: function () {
				return this.player_state;
			},

			get_current_time: function () {
				return this.current_time;
			},
			get_duration: function () {
				return this.duration;
			},

			get_video_data: function () {
				return this.video_data;
			},
			get_playlist: function () {
				return this.playlist;
			},
			get_playlist_index: function () {
				return this.playlist_index;
			},

			get_api: function () {
				return this.extended_api;
			},
			set_api: function (module, option, value) {
				// Send event
				send_command.call(this, "setOption", [ module , option , value ]);
			},

		};



		// Return class
		return Player;

	})();



	// Return module
	return {
		version_info: version_info,
		supported: support_check(),
		Player: Player,
	};

})();



