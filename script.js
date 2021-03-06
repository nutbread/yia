


(function () {
	"use strict";



	// Module for performing actions as soon as possible
	var on_ready = (function () {

		// Vars
		var callbacks = [],
			check_interval = null,
			check_interval_time = 250;

		// Check if ready and run callbacks
		var callback_check = function () {
			if (
				(document.readyState === "interactive" || document.readyState === "complete") &&
				callbacks !== null
			) {
				// Run callbacks
				var cbs = callbacks,
					cb_count = cbs.length,
					i;

				// Clear
				callbacks = null;

				for (i = 0; i < cb_count; ++i) {
					cbs[i].call(null);
				}

				// Clear events and checking interval
				window.removeEventListener("load", callback_check, false);
				window.removeEventListener("readystatechange", callback_check, false);

				if (check_interval !== null) {
					clearInterval(check_interval);
					check_interval = null;
				}

				// Okay
				return true;
			}

			// Not executed
			return false;
		};

		// Listen
		window.addEventListener("load", callback_check, false);
		window.addEventListener("readystatechange", callback_check, false);

		// Callback adding function
		return function (cb) {
			if (callbacks === null) {
				// Ready to execute
				cb.call(null);
			}
			else {
				// Delay
				callbacks.push(cb);

				// Set a check interval
				if (check_interval === null && callback_check() !== true) {
					check_interval = setInterval(callback_check, check_interval_time);
				}
			}
		};

	})();

	var bind = function (callback, self) {
		if (arguments.length > 2) {
			var slice = Array.prototype.slice,
				push = Array.prototype.push,
				args = slice.call(arguments, 2);

			return function () {
				var full_args = slice.call(args);
				push.apply(full_args, arguments);

				return callback.apply(self, full_args);
			};
		}
		else {
			return function () {
				return callback.apply(self, arguments);
			};
		}
	};
	
	var restyle_noscript = function () {
		// Script
		var nodes = document.querySelectorAll(".script_disabled"),
			i;

		for (i = 0; i < nodes.length; ++i) {
			nodes[i].classList.remove("script_visible");
		}

		nodes = document.querySelectorAll(".script_enabled");
		for (i = 0; i < nodes.length; ++i) {
			nodes[i].classList.add("script_visible");
		}
	};

	var script_add = (function () {

		var script_on_load = function (state, event) {
			// Okay
			script_remove_event_listeners.call(this, state, true);
		};
		var script_on_error = function (state, event) {
			// Error
			script_remove_event_listeners.call(this, state, false);
		};
		var script_on_readystatechange = function (state, event) {
			if (this.readyState === "loaded" || this.readyState === "complete") {
				// Okay
				script_remove_event_listeners.call(this, state, true);
			}
		};
		var script_remove_event_listeners = function (state, okay) {
			// Remove event listeners
			this.addEventListener("load", state.on_load, false);
			this.addEventListener("error", state.on_error, false);
			this.addEventListener("readystatechange", state.on_readystatechange, false);

			state.on_load = null;
			state.on_error = null;
			state.on_readystatechange = null;

			// Trigger
			if (state.callback) state.callback.call(null, okay, this);

			// Remove
			var par = this.parentNode;
			if (par) par.removeChild(this);
		};



		return function (url, callback) {
			var head = document.head,
				script, state;

			if (!head) {
				// Callback and done
				callback.call(null, false, null);
				return false;
			}

			// Load state
			state = {
				on_load: null,
				on_error: null,
				on_readystatechange: null,
				callback: callback,
			};

			// New script tag
			script = document.createElement("script");
			script.async = true;
			script.setAttribute("src", url);

			// Events
			script.addEventListener("load", (state.on_load = script_on_load.bind(script, state)), false);
			script.addEventListener("error", (state.on_error = script_on_error.bind(script, state)), false);
			script.addEventListener("readystatechange", (state.on_readystatechange = script_on_readystatechange.bind(script, state)), false);

			// Add
			head.appendChild(script);

			// Done
			return true;
		};

	})();



	// Class to manage URL navigation with the hash fragment
	var HashNavigation = (function () {

		var HashNavigation = function () {
			this.sep = "#!";

			this.events = {
				"change": [],
			};
		};



		var re_encode_pretty = /\%20/g,
			re_decode_pretty = /\+/g,
			re_decode_var = /^(.*?)(?:=(.*))?$/,
			re_encode_simple = /[ %]/g,
			re_encode_simple_map = {
				" ": "+",
				"%": "%25",
			},
			re_url_info = /^(?:([a-z][a-z0-9\-\+\.]*):)?(?:\/*)([^\/\?\#]*)([^\?\#]*)([^\#]*)(.*)$/i,
			re_url_offset_str = "x:x/x?x#";

		var escape_var = function (str) {
			return encodeURIComponent(str).replace(re_encode_pretty, "+");
		};
		var escape_var_simple = function (str) {
			return str.replace(re_encode_simple, escape_var_simple_replacer);
		};
		var escape_var_simple_replacer = function (m) {
			return re_encode_simple_map[m[0]];
		};
		var unescape_var = function (str) {
			return decodeURIComponent(str.replace(re_decode_pretty, "%20"));
		};

		var on_window_popstate = function (event) {
			// Trigger
			trigger.call(this, "change", {
				init: false,
				pop: true,
			});
		}


		var trigger = function (event, data) {
			// Trigger an event
			var callbacks = this.events[event],
				i;

			for (i = 0; i < callbacks.length; ++i) {
				callbacks[i].call(this, data, event);
			}
		};



		HashNavigation.prototype = {
			constructor: HashNavigation,

			/**
				Get information from a URL string.

				@param url
					The stringified URL
				@param offset
					An integer representing the URL component to start at.
					Valid values are:
						0: start at the protocol (this is the default)
						1: start at the website name
						2: start at the website path
						3: start at the search
						4: start at the hash fragment
					Invalid values will cause undefined behavior
				@return
					An object of the form:
					{
						protocol: string,
						site: string,
						path: string,
						search: string,
						hash: string,
					}
			*/
			get_url_parts: function (url, offset) {
				var default_value = "",
					parts = [
						default_value, // protocol
						default_value, // site
						default_value, // path
						default_value, // search
						default_value, // hash
					],
					match, i, obj;

				// Update string and match
				offset = offset || 0;
				if (offset > 0) url = re_url_offset_str.substr(0, offset * 2) + url;
				match = re_url_info.exec(url);

				// Parts
				for (i = offset; i < 5; ++i) {
					parts[i] = match[i + 1] || default_value;
				}

				// Object
				obj = {
					protocol: parts[0],
					site: parts[1],
					path: parts[2],
					search: parts[3],
					hash: parts[4],
				};

				// Done
				return obj;
			},

			strip_hash: function (hash) {
				var i;
				for (i = 0; i < this.sep.length; ++i) {
					if (hash[i] != this.sep[i]) break;
				}
				if (i > 0) {
					hash = hash.substr(i);
				}
				return hash;
			},
			strip_search: function (search) {
				return (search[0] == "?") ? search.substr(1) : search;
			},

			encode_vars: function (vars, escape_components) {
				var str = "",
					first = true,
					escape_fcn = (escape_components == null || escape_components) ? escape_var : escape_var_simple,
					v;

				if (Array.isArray(vars)) {
					for (v = 0; v < vars.length; ++v) {
						if (v > 0) str += "&";

						str += escape_fcn(vars[v][0]);
						if (vars[v].length > 1) {
							str += "=";
							str += escape_fcn(vars[v][1]);
						}
					}
				}
				else {
					for (v in vars) {
						if (first) first = false;
						else str += "&";

						str += escape_fcn(v);
						if (vars[v] != null) {
							str += "=";
							str += escape_fcn(vars[v]);
						}
					}
				}

				return str;
			},
			decode_vars: function (str) {
				var vars = {},
					str_split = str.split("&"),
					match, i;

				for (i = 0; i < str_split.length; ++i) {
					// Get the match
					if (str_split[i].length == 0) continue;
					match = re_decode_var.exec(str_split[i]);

					// Set the var
					vars[unescape_var(match[1])] = (match[2] == null) ? null : unescape_var(match[2]);
				}

				// Return the vars
				return vars;
			},

			setup: function () {
				// Events
				window.addEventListener("popstate", on_window_popstate.bind(this), false);

				// Init trigger
				trigger.call(this, "change", {
					init: true,
					pop: false,
				});
			},
			go: function (hash, replace) {
				// Setup url
				var url = window.location.pathname,
					i;

				if (hash != null) {
					url += this.sep + this.strip_hash(hash);
				}

				if (replace) {
					window.history.replaceState({}, "", url);
				}
				else {
					window.history.pushState({}, "", url);
				}

				// Trigger
				trigger.call(this, "change", {
					init: false,
					pop: false,
				});
			},

			on: function (event, callback) {
				if (event in this.events) {
					this.events[event].push(callback);
					return true;
				}
				return false;
			},
			off: function (event, callback) {
				if (event in this.events) {
					var callbacks = this.events[event],
						i;

					for (i = 0; i < callbacks.length; ++i) {
						if (callbacks[i] == callback) {
							callbacks.splice(i, 1);
							return true;
						}
					}
				}
				return false;
			},

		};



		return HashNavigation;

	})();



	// Module to get geometry
	var Geometry = (function () {

		var Rect = function (left, top, right, bottom) {
			this.left = left;
			this.top = top;
			this.right = right;
			this.bottom = bottom;
		};

		var functions = {
			document_rect: function () {
				var win = window,
					doc = document.documentElement,
					left = (win.pageXOffset || doc.scrollLeft || 0) - (doc.clientLeft || 0),
					top = (win.pageYOffset || doc.scrollTop || 0)  - (doc.clientTop || 0);

				return new Rect(
					left,
					top,
					left + (doc.clientWidth || win.innerWidth || 0),
					top + (doc.clientHeight || win.innerHeight || 0)
				);
			},
			object_rect: function (obj) {
				var bounds = obj.getBoundingClientRect(),
					win = window,
					doc = document.documentElement,
					left = (win.pageXOffset || doc.scrollLeft || 0) - (doc.clientLeft || 0),
					top = (win.pageYOffset || doc.scrollTop || 0)  - (doc.clientTop || 0);

				return new Rect(
					left + bounds.left,
					top + bounds.top,
					left + bounds.right,
					top + bounds.bottom
				);
			},
		};

		return functions;

	})();



	// Navigation panel control class
	var NavigationPanel = (function () {

		var NavigationPanel = function () {
			this.okay = (
				(this.column = document.querySelector(".navigation_column")) !== null &&
				(this.container = this.column.querySelector(".navigation_container")) !== null &&
				(this.main = this.container.querySelector(".navigation")) !== null &&
				(this.padding = this.main.querySelector(".navigation_padding")) !== null &&
				(this.body = this.padding.querySelector(".navigation_body")) !== null
			);

			this.floating = (this.okay && this.column.classList.contains("navigation_column_floating"));
			this.bottom = (this.okay && this.column.classList.contains("navigation_bottom"));
		};



		var update_navigation_scroll = function () {
			if (!this.floating) {
				var doc_rect = Geometry.document_rect(),
					main_rect = Geometry.object_rect(this.main);

				if (this.bottom) {
					if (main_rect.bottom > doc_rect.bottom) {
						this.column.classList.add("navigation_column_floating");
						this.floating = true;
					}
				}
				else {
					if (main_rect.top < doc_rect.top) {
						this.column.classList.add("navigation_column_floating");
						this.floating = true;
					}
				}
			}
			if (this.floating) {
				var column_rect = Geometry.object_rect(this.column),
					body_rect = Geometry.object_rect(this.body);

				if (body_rect.top <= column_rect.top) {
					// Align to top
					this.column.classList.remove("navigation_column_floating");
					this.column.classList.remove("navigation_bottom");
					this.floating = false;
					this.bottom = false;
				}
				else if (body_rect.bottom >= column_rect.bottom) {
					// Align to bottom
					this.column.classList.remove("navigation_column_floating");
					this.column.classList.add("navigation_bottom");
					this.floating = false;
					this.bottom = true;
				}
			}
		};



		NavigationPanel.prototype = {
			constructor: NavigationPanel,

			setup: function () {
				var self = this;

				update_navigation_scroll.call(this);

				window.addEventListener("scroll", function (event) {
					update_navigation_scroll.call(self);
				}, false);
			},
		};



		return NavigationPanel;

	})();



	// Functions
	var nav = new HashNavigation();
	nav.sep = "#";

	var on_doc_name_click = function (event) {
		// find doc_block parent
		var block;
		for (block = this.parentNode; block !== null; block = block.parentNode) {
			if (block.classList.contains("doc_block")) {
				// Perform
				var id = block.getAttribute("id"),
					display_mode = block.querySelector(".doc_block_display_mode:checked"),
					display_mode_id = (display_mode ? 1 - (+display_mode.value) : 0),
					target;

				if ((target = block.querySelector(".doc_block_display_mode_" + display_mode_id)) !== null) {
					target.checked = true;
					if (id) {
						if (display_mode_id == 0) {
							if (window.location.hash == "#" + id) {
								nav.go(null, true);
							}
						}
						else {
							nav.go("#" + id, true);
						}
					}
				}

				// Done
				event.preventDefault();
				event.stopPropagation();
				break;
			}
		}
	};

	var on_demo_start_click = function (event) {
		// Start demo
		begin_demo();

		// Update URL
		nav.go(this.getAttribute("href") || "", true);

		// Stop click
		event.preventDefault();
		event.stopPropagation();
		return false;
	};

	var on_doc_expand_all_click = function (event) {
		var nodes = document.querySelectorAll(".doc_block_display_mode.doc_block_display_mode_1"),
			i;

		for (i = 0; i < nodes.length; ++i) {
			nodes[i].checked = true;
		}
	};
	var on_doc_shrink_all_click = function (event) {
		var nodes = document.querySelectorAll(".doc_block_display_mode.doc_block_display_mode_0"),
			i;

		for (i = 0; i < nodes.length; ++i) {
			nodes[i].checked = true;
		}
	};

	var begin_demo = (function () {

		var already_started = false;

		var on_script_ready = function (data, error_message, okay, script) {
			var error_message, node, youtube_module, demo_class;

			++data.load_count;
			if (!okay) {
				data.errors.push(error_message);
			}

			if (data.load_count == data.load_count_total) {
				if (data.errors.length > 0) {
					error_message = data.errors.join("; ") + ".";
				}
				else {
					// Get vars
					try {
						youtube_module = Youtube;
					}
					catch (e) {
						youtube_module = null;
					}
					try {
						demo_class = Demo;
					}
					catch (e) {
						demo_class = null;
					}

					if (youtube_module && demo_class) {
						// Show
						node = document.querySelector(".demo_region_preload");
						if (node) node.classList.remove("demo_region_preload_visible");

						// Run, and expose demo for testing using console if desired
						window.demo = new demo_class(youtube_module);

						// Done
						return;
					}

					// Error
					error_message = "Script load failed.";
				}


				// Display error
				node = document.querySelector(".demo_status_message");
				if (node) node.textContent = error_message;
			}
		};

		return function () {
			// Only run once
			if (already_started) return;
			already_started = true;

			var data = {
				status_node: document.querySelector(".demo_status_message"),
				load_count: 0,
				load_count_total: 2,
				errors: [],
			};

			// Add script
			script_add("src/youtube_iframe_api.js", bind(on_script_ready, null, data, "Error loading iframe API"));
			script_add("src/demo.js", bind(on_script_ready, null, data, "Error loading demo script"));

			// Update node display
			if (data.status_node) {
				data.status_node.classList.add("demo_status_message_visible");
			}
		};

	})();



	// Execute
	on_ready(function () {
		// Noscript
		restyle_noscript();

		// Window scrolling
		var np = new NavigationPanel();
		if (np.okay) np.setup();

		// Change some label links
		var nodes, i;

		nodes = document.querySelectorAll(".doc_name,.doc_member_name");
		for (i = 0; i < nodes.length; ++i) {
			nodes[i].addEventListener("click", on_doc_name_click, false);
		}

		if ((i = document.getElementById("doc_expand_all"))) {
			i.addEventListener("click", on_doc_expand_all_click, false);
		}

		if ((i = document.getElementById("doc_shrink_all"))) {
			i.addEventListener("click", on_doc_shrink_all_click, false);
		}

		if ((i = document.getElementById("demo_start"))) {
			i.addEventListener("click", on_demo_start_click, false);
		}
	});

})();


