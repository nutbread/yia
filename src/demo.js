


var Demo = (function () {
	"use strict";



	var Demo = function () {
		var Player = Youtube.Player,
			list, iframe, i, n1, n2, n3, n4, n5;

		this.container = document.querySelector(".demo_region");

		this.default_video = "r-qhj3sJ5qs";
		this.default_playlists = [
			[ null ]
		];

		this.player = new Player({
			video_id: this.default_video,
			params: {
				iv_load_policy: 3,
				rel: 0,
				showinfo: 0,
				modestbranding: 0,
			},
			on: {}
		});

		this.node_actions = document.getElementById("demo_actions");
		this.node_playlist = document.getElementById("demo_playlist");
		this.node_playback = document.getElementById("demo_playback");
		this.node_state = document.getElementById("demo_state");
		this.node_loading = document.getElementById("demo_loading");
		this.node_extended_api = document.getElementById("demo_extended_api");
		this.node_log = document.getElementById("demo_log");
		this.node_iframe_container = document.querySelector(".demo_iframe_container");


		// Setup event logging
		this.log_max = 50;
		list = [//{
			"ready",

			"yt_state_change",
			"yt_playback_quality_change",
			"yt_playback_rate_change",
			"yt_api_change",
			"yt_error",

			"state_change",
			"volume_change",
			"time_change",
			"duration_change",
			"progress",
			"playback_quality_change",
			"playback_rate_change",
			"playback_qualities_available_change",
			"playback_rates_available_change",
			"playlist_change",
			"playlist_index_change",
			"api_change",
		];//}
		for (i = 0; i < list.length; ++i) {
			this.player.on(list[i], this.log_event.bind(this, list[i]));
		}


		// Setup actions
		list = [//{
			["Play", this.player, Player.prototype.play],
			["Pause", this.player, Player.prototype.pause],
			["Stop", this.player, Player.prototype.stop],
			["Clear", this.player, Player.prototype.clear],
			["Mute", this.player, Player.prototype.mute],
			["Unmute", this.player, Player.prototype.unmute],
			["Next in Playlist", this.player, Player.prototype.goto_next],
			["Previous in Playlist", this.player, Player.prototype.goto_previous],
			["Set Volume 0%", this.player, Player.prototype.set_volume, 0],
			["Set Volume 50%", this.player, Player.prototype.set_volume, 50],
			["Set Volume 100%", this.player, Player.prototype.set_volume, 100],
			["Seek To 0%", this, Demo.prototype.seek_to, 0.0],
			["Seek To 50%", this, Demo.prototype.seek_to, 0.5],
			["Seek To 100%", this, Demo.prototype.seek_to, 1.0],
			["Enable Playlist Loop", this.player, Player.prototype.set_loop, true],
			["Disable Playlist Loop", this.player, Player.prototype.set_loop, false],
			["Enable Playlist Shuffle", this.player, Player.prototype.set_shuffle, true],
			["Disable Playlist Shuffle", this.player, Player.prototype.set_shuffle, false],
			["Destroy Player", this.player, Player.prototype.destroy],
		];//}
		for (i = 0; i < list.length; ++i) {
			n1 = document.createElement("div");
			n1.className = "demo_action_entry";

			n2 = document.createElement("a");
			n2.className = "demo_action_link";
			n2.textContent = list[i][0];
			n2.addEventListener("click", this.on_action_click.bind(this, list[i].slice(1)), false);
			n1.appendChild(n2);

			this.node_actions.appendChild(n1);
		}


		// Setup state
		list = [//{
			["Player State", "state_change", Player.prototype.get_player_state, Demo.prototype.format_player_state, null],
			["Time", "time_change", Player.prototype.get_current_time, Demo.prototype.format_timecode, null],
			["Duration", "duration_change", Player.prototype.get_duration, Demo.prototype.format_timecode, null],
			["Load Progress", "progress", Player.prototype.get_loaded_fraction, Demo.prototype.format_percent, null],
			["Volume", "volume_change", Player.prototype.get_volume, Demo.prototype.format_volume, null],
			["Muted", "volume_change", Player.prototype.is_muted, Demo.prototype.format_boolean, null],
		];//}
		for (i = 0; i < list.length; ++i) {
			n1 = document.createElement("div");
			n1.className = "demo_state_entry";

			n2 = document.createElement("span");
			n2.className = "demo_state_label";
			n2.textContent = list[i][0] + ":";
			n1.appendChild(n2);

			n2 = document.createElement("span");
			n2.className = "demo_state_value";
			n2.textContent = "...";
			n1.appendChild(n2);

			list[i][4] = n2;
			this.player.on(list[i][1], this.on_generic_state_change.bind(this, list[i][2], list[i][3], n2));

			this.node_state.appendChild(n1);
		}
		this.player.on("ready", this.on_ready_state_setup.bind(this, list));


		// Setup loading
		list = [//{
			[ "Video ID:", "video id", "r-qhj3sJ5qs", Player.prototype.load_video, this.player, [null, true, null, null, null] ],
			[ "Video URL:", "video url", "https://www.youtube.com/embed/r-qhj3sJ5qs", Player.prototype.load_video_from_url, this.player, [null, true, null, null, null] ],
			[ "Playlist Custom:", "video ids", "r-qhj3sJ5qs,xwg2Hpf4ta8", Demo.prototype.load_custom_playlist, this, [ null ] ],
			[ "Playlist ID:", "playlist id", "UUI4fJYWKcGa8MvnvLw0qysQ", Player.prototype.load_playlist, this.player, [null, "playlist", 0, true, null, null] ],
			[ "User Uploads:", "user uploads", "crnaviofficial", Player.prototype.load_playlist, this.player, [null, "user_uploads", 0, true, null, null] ],
			[ "Search Query:", "search results", "WORLD ORDER MACHINE CIVILIZATION", Player.prototype.load_playlist, this.player, [null, "search", 0, true, null, null] ],
		];//}
		for (i = 0; i < list.length; ++i) {
			n1 = document.createElement("div");
			n1.className = "demo_loading_entry";

			n2 = document.createElement("div");
			n2.className = "demo_loading_label";
			n2.textContent = list[i][0];
			n1.appendChild(n2);

			n2 = document.createElement("div");
			n2.className = "demo_loading_table";
			n1.appendChild(n2);

			n3 = document.createElement("div");
			n2.appendChild(n3);

			n4 = document.createElement("input");
			n4.className = "demo_loading_input";
			n4.setAttribute("type", "text");
			n4.setAttribute("placeholder", list[i][1]);
			n4.value = list[i][2];
			n3.appendChild(n4);

			n3 = document.createElement("div");
			n2.appendChild(n3);

			n5 = document.createElement("a");
			n5.className = "demo_loading_button";
			n5.setAttribute("type", "text");
			n5.textContent = "load";
			n5.addEventListener("click", this.on_loading_start_new.bind(this, n4, list[i][3], list[i][4], list[i][5], 0), false);
			n3.appendChild(n5);

			this.node_loading.appendChild(n1);
		}


		// Setup playlist
		this.player.on("playlist_change", this.on_playlist_change.bind(this));
		this.player.on("playlist_index_change", this.on_playlist_index_change.bind(this));
		this.player.on("video_data_change", this.on_video_data_change.bind(this));


		// Setup extended API
		this.player.on("api_change", this.on_api_change.bind(this));


		// Setup playback settings
		n1 = document.createElement("div");
		n1.className = "demo_playback_title";
		n1.textContent = "Quality Levels:";
		this.node_playback.appendChild(n1);

		this.node_playback_qualities = document.createElement("div");
		this.node_playback_qualities.className = "demo_playback_entries";
		this.node_playback.appendChild(this.node_playback_qualities);

		n1 = document.createElement("div");
		n1.className = "demo_playback_title";
		n1.textContent = "Rates:";
		this.node_playback.appendChild(n1);

		this.node_playback_rates = document.createElement("div");
		this.node_playback_rates.className = "demo_playback_entries";
		this.node_playback.appendChild(this.node_playback_rates);

		this.player.on("playback_quality_change", this.on_quality_change.bind(this));
		this.player.on("playback_rate_change", this.on_rate_change.bind(this));
		this.player.on("playback_qualities_available_change", this.on_qualities_change.bind(this));
		this.player.on("playback_rates_available_change", this.on_rates_change.bind(this));


		// Setup iframe
		iframe = this.player.get_iframe();
		iframe.className = "demo_iframe";
		this.node_iframe_container.appendChild(iframe);

		// Event date start
		this.init_date = new Date();
	};



	Demo.prototype = {
		constructor: Demo,

		on_ready_state_setup: function (state_vars, event) {
			var i, sv;

			for (i = 0; i < state_vars.length; ++i) {
				sv = state_vars[i];
				this.on_generic_state_change(sv[2], sv[3], sv[4], null);
			}

			// Update API
			this.on_api_change(null);

			// Update playback settings
			this.on_qualities_change(null);
			this.on_rates_change(null);

			// Playlist
			this.on_video_data_change(null);
			this.on_playlist_change(null);
		},
		on_action_click: function (args, event) {
			if (event.which !== 1) return;

			// Perform
			args[1].apply(args[0], args.slice(2));

			// Stop
			event.preventDefault();
			event.stopPropagation();
			return false;
		},
		on_generic_state_change: function (getter, formatter, node, event) {
			var value = formatter.call(this, getter.call(this.player));

			node.textContent = value;
		},
		on_api_change: function (event) {
			this.node_extended_api.value = JSON.stringify(this.player.get_api(), null, 2);
		},

		on_quality_change: function (event) {
			var quality = this.player.get_playback_quality(),
				nodes = this.node_playback_qualities.querySelectorAll(".demo_playback_entry_current"),
				node, i;

			for (i = 0; i < nodes.length; ++i) {
				nodes[i].classList.remove("demo_playback_entry_current");
			}

			node = this.node_playback_qualities.querySelector(".demo_playback_entry[data-value='" + quality + "']");
			if (node) node.classList.add("demo_playback_entry_current");
		},
		on_qualities_change: function (event) {
			// Re-create
			this.node_playback_qualities.innerHTML = "";

			var n1, n2, quality, i;
			for (i = 0; i < this.player.get_playback_qualities_available().length; ++i) {
				quality = this.player.get_playback_qualities_available()[i];

				n1 = document.createElement("div");
				n1.className = "demo_playback_entry";
				n1.setAttribute("data-value", quality);

				n2 = document.createElement("a");
				n2.className = "demo_playback_entry_link";
				n2.textContent = quality;
				n2.addEventListener("click", this.on_quality_click.bind(this, quality), false);
				n1.appendChild(n2);

				this.node_playback_qualities.appendChild(n1);
			}

			// Update quality
			this.on_quality_change(null);
		},
		on_rate_change: function (event) {
			var rate = this.player.get_playback_rate(),
				nodes = this.node_playback_rates.querySelectorAll(".demo_playback_entry_current"),
				node, i;

			for (i = 0; i < nodes.length; ++i) {
				nodes[i].classList.remove("demo_playback_entry_current");
			}

			node = this.node_playback_rates.querySelector(".demo_playback_entry[data-value='" + rate + "']");
			if (node) node.classList.add("demo_playback_entry_current");
		},
		on_rates_change: function (event) {
			// Re-create
			this.node_playback_rates.innerHTML = "";

			var n1, n2, rate, i;
			for (i = 0; i < this.player.get_playback_rates_available().length; ++i) {
				rate = this.player.get_playback_rates_available()[i];

				n1 = document.createElement("div");
				n1.className = "demo_playback_entry";
				n1.setAttribute("data-value", rate);

				n2 = document.createElement("a");
				n2.className = "demo_playback_entry_link";
				n2.textContent = rate;
				n2.addEventListener("click", this.on_rate_click.bind(this, rate), false);
				n1.appendChild(n2);

				this.node_playback_rates.appendChild(n1);
			}

			// Update rate
			this.on_rate_change(null);
		},
		on_quality_click: function (new_quality, event) {
			this.player.set_playback_quality(new_quality);
		},
		on_rate_click: function (new_rate, event) {
			this.player.set_playback_rate(new_rate);
		},

		on_loading_start_new: function (input_node, func, this_obj, args, modify_id, event) {
			// Update
			args[modify_id] = input_node.value;

			// Call
			func.apply(this_obj, args);

			// Reset
			args[modify_id] = null;
		},

		on_video_data_change: function (event) {
			if (this.player.get_playlist() === null) {
				this.node_playlist.classList.add("demo_playlist_none");
				this.node_playlist.textContent = JSON.stringify(this.player.get_video_data(), null, 2);
			}
		},
		on_playlist_change: function (event) {
			// Add new
			var playlist = this.player.get_playlist(),
				n1, n2, video_id, i;

			if (playlist === null) {
				// No playlist
				this.on_video_data_change();
				return;
			}
			this.node_playlist.innerHTML = "";
			this.node_playlist.classList.remove("demo_playlist_none");

			for (i = 0; i < playlist.length; ++i) {
				video_id = playlist[i];

				n1 = document.createElement("div");
				n1.className = "demo_playlist_entry";

				n2 = document.createElement("a");
				n2.className = "demo_playlist_entry_link";
				n2.textContent = "" + i + ": " + video_id;
				n2.addEventListener("click", this.on_playlist_click.bind(this, i), false);
				n1.appendChild(n2);

				this.node_playlist.appendChild(n1);
			}

			// Update index
			this.on_playlist_index_change(null);
		},
		on_playlist_index_change: function (event) {
			var id = this.player.get_playlist_index(),
				nodes = this.node_playlist.querySelectorAll(".demo_playlist_entry_current"),
				i;

			for (i = 0; i < nodes.length; ++i) {
				nodes[i].classList.remove("demo_playlist_entry_current");
			}

			if (id >= 0 && id < this.node_playlist.children.length) {
				this.node_playlist.children[id].classList.add("demo_playlist_entry_current");
			}
		},
		on_playlist_click: function (playlist_index, event) {
			this.player.goto_at(playlist_index);
		},

		log_event: function (event_name, data) {
			// Check if it's already scrolled to the bottom
			var par = this.node_log.parentNode,
				distance_to_bottom = (par.scrollHeight - par.clientHeight) - par.scrollTop,
				time_diff = ((new Date()) - this.init_date) / 1000.0,
				time_str, i, j, n1, n2, n3, n4;

			// Remove children;
			while (this.node_log.children.length >= this.log_max) {
				this.node_log.removeChild(this.node_log.firstChild);
			}

			// Format time difference
			i = Math.floor(time_diff / 60);
			time_str = "+" + i + ":";

			i = (time_diff % 60);
			j = i.toFixed(2);
			if (j[1] == ".") time_str += "0";
			time_str += j;

			// Create nodes
			n1 = document.createElement("div");
			n1.className = "demo_log_entry";

			n2 = document.createElement("div");
			n2.className = "demo_log_entry_title";
			n1.appendChild(n2);

			n3 = document.createElement("div");
			n3.className = "demo_log_entry_title_left";
			n2.appendChild(n3);

			n4 = document.createElement("span");
			n4.className = "demo_log_entry_title_type";
			n4.textContent = "Event:";
			n3.appendChild(n4);

			n4 = document.createElement("span");
			n4.className = "demo_log_entry_title_name";
			n4.textContent = event_name;
			n3.appendChild(n4);

			n3 = document.createElement("div");
			n3.className = "demo_log_entry_title_right";
			n3.textContent = time_str;
			n2.appendChild(n3);

			n2 = document.createElement("div");
			n2.className = "demo_log_entry_body";
			n2.textContent = JSON.stringify(data, null, 2);
			n1.appendChild(n2);

			this.node_log.appendChild(n1);

			// Scroll to bottom
			if (distance_to_bottom <= 0) {
				par.scrollTop = par.scrollHeight - par.clientHeight;
			}
		},

		load_custom_playlist: function (data) {
			this.player.load_playlist(data.split(","), "playlist", 0, true, null, null);
		},

		format_timecode: function (x) {
			var i, j, time_str = "";

			i = Math.floor(x / 60);
			time_str += i
			time_str += ":";

			i = (x % 60);
			j = i.toFixed(2);
			if (j[1] == ".") time_str += "0";
			time_str += j;

			return time_str;
		},
		format_percent: function (x) {
			return Math.round(x * 100) + "%";
		},
		format_player_state: function (x) {
			if (x == Youtube.Player.UNSTARTED) return "unstarted";
			if (x == Youtube.Player.ENDED) return "ended";
			if (x == Youtube.Player.PLAYING) return "playing";
			if (x == Youtube.Player.PAUSED) return "paused";
			if (x == Youtube.Player.BUFFERING) return "buffering";
			if (x == Youtube.Player.CUED) return "cued";
			return x;
		},
		format_volume: function (x) {
			return Math.round(x) + "%";
		},
		format_boolean: function (x) {
			return x ? "true" : "false";
		},

		seek_to: function (percent) {
			this.player.seek(this.player.get_duration() * percent, true);
		},

	};



	return Demo;

})();


