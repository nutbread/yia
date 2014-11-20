__section_name = None;


def set_section_name(new_section_name):
	global __section_name;
	__section_name = new_section_name;


def section_header(name, id, short_id):
	global __section_name;
	__section_name = short_id;

	src = '<h6 id="{1:s}"><span class="hardlink_text">{0:s}<a class="hardlink" href="#{1:s}"></a></span></h6>'.format(name, id);

	return src;


def function_header(method_object, method_info, return_type, params, options=None):
	global __section_name;

	method_name = method_info[0];
	method_attr = method_info[1] if (len(method_info) > 1) else {};
	return_name = return_type[0];
	return_attr = return_type[1] if (len(return_type) > 1) else {};

	if (__section_name is None):
		function_id = "{0:s}".format(method_name);
	else:
		function_id = "{0:s}.{1:s}".format(__section_name, method_name);

	# Descriptions
	descriptions = [];
	if ("description" in method_attr):
		descriptions.append(
			u'<div class="doc_description doc_description_main">{0:s}</div>'.format(method_attr["description"])
		);

	src = [
		'<li><div class="doc_block" id="{0:s}"><input type="radio" class="doc_block_display_mode doc_block_display_mode_0" value="0" id="{0:s}.display.0" name="{0:s}.display.mode" checked /><input type="radio" class="doc_block_display_mode doc_block_display_mode_1" value="1" id="{0:s}.display.1" name="{0:s}.display.mode" />'.format(function_id),
		'<div class="doc_block_indicator hardlink_text"><span class="doc_block_indicator_inner"><label class="doc_block_indicator_text" for="{0:s}.display.1"></label><label class="doc_block_indicator_text" for="{0:s}.display.0"></label></span><a class="doc_block_indicator_hardlink hardlink" href="#{0:s}"></a></div>'.format(function_id),
	];


	# Params
	extra_classes = "";
	if (options is None or "block_header" not in options or options["block_header"]):
		extra_classes += " doc_params_block";
	if (options is not None and "full_header" in options and options["full_header"]):
		extra_classes += " doc_head_full";
	if (len(params) == 0):
		extra_classes += " doc_params_none";

	src.append(
		'<code class="doc_head{1:s}">'.format(function_id, extra_classes)
	);

	# Params
	if (options is not None and "prefix" in options):
		src.extend([
			'<span class="doc_obj">{0:s}</span>'.format(options["prefix"]),
		]);

	if (method_object is not None):
		src.extend([
			'<span class="doc_obj">{0:s}</span>'.format(method_object),
			'<span class="doc_punct">.</span>',
		]);

	src.append(
		# '<a class="doc_name" href="#{1:s}"><span>{0:s}</span></a>'.format(method_name, function_id)
		'<label class="doc_name" for="{1:s}.display.1"><span>{0:s}</span></label>'.format(method_name, function_id)
	);
	src.append(
		'<span class="doc_params_outer">(<span class="doc_params">'
	);

	# Params
	for i in range(len(params)):
		# Parameter block
		param_name = params[i][0];
		param_attr = params[i][1] if (len(params[i]) > 1) else {};
		param_classes = "";
		if ("kw" in param_attr and param_attr["kw"]):
			param_classes += " doc_param_keyword";

		src.append(
			'<span class="doc_param{0:s}"><span><a class="doc_param_name" href="#{2:s}.{1:s}"><span>{1:s}</span></a>'.format(param_classes, param_name, function_id)
		);

		if ("default" in param_attr):
			src.append(
				'=<span class="doc_param_default">{0:s}</span>'.format(repr(param_attr["default"]))
			);
		elif ("default_as" in param_attr):
			src.append(
				'=<span class="doc_param_default">{0:s}</span>'.format(param_attr["default_as"])
			);

		src.append('</span>');

		if (i + 1 < len(params)): src.append(', ');

		src.append('</span>');

		# Descriptions
		if ("description" in param_attr or "type" in param_attr):
			type = u'';
			desc = u'';
			if ("type" in param_attr):
				type = u'<span class="doc_param_type"> : {0:s}</span>'.format(param_attr["type"]);
			if ("description" in param_attr):
				desc = u'<div class="doc_description_body">{0:s}</div>'.format(param_attr["description"]);

			descriptions.append(
				u'<div class="doc_description doc_description_param" id="{3:s}.{0:s}"><code><a class="doc_description_param_name" href="#{3:s}.{0:s}"><span>{0:s}</span></a>{1:s}</code>{2:s}</div>'.format(param_name, type, desc, function_id)
			);

	if ("description" in return_attr):
		descriptions.append(
			u'<div class="doc_description doc_description_return" id="{2:s}.return"><code><a class="doc_description_return_name" href="#{2:s}.return"><span>return</span></a><span class="doc_param_type"> : {0:s}</span></code><div class="doc_description_body">{1:s}</div></div>'.format(return_name, return_attr["description"], function_id)
		);

	# Close block
	src.append('</span>');
	if (len(params) > 0): src.append('<span class="doc_params_placeholder">...</span>');
	src.append(')</span>');
	if (return_name is not None):
		src.append('<span class="doc_return_container"> : <a class="doc_return" href="#{1:s}.return"><span>{0:s}</span></a></span>'.format(return_name, function_id));
	src.append('</code>');

	# Descriptions
	if (len(descriptions) > 0):
		description_id = "{0:s}.descriptions".format(function_id);

		src.append('<div class="doc_descriptions">');
		src.append(u"".join(descriptions));
		src.append('</div>');

	src.append('</div></li>');

	# Done
	return u"".join(src);


def member_header(member_object, member_info, extra_info):
	global __section_name;

	if (not isinstance(member_info, list)):
		member_infos = [ member_info ];
	else:
		member_infos = member_info;

	if (__section_name is None):
		this_section_name = "";
	else:
		this_section_name = __section_name + ".";

	if (len(member_infos) == 1):
		main_id = "{0:s}{1:s}".format(this_section_name, member_infos[0][0]);
	else:
		main_id = "{0:s}{1:s}".format(this_section_name, extra_info["id"]);


	# Setup
	src = [
		'<li><div class="doc_block" id="{0:s}"><input type="radio" class="doc_block_display_mode doc_block_display_mode_0" value="0" id="{0:s}.display.0" name="{0:s}.display.mode" checked /><input type="radio" class="doc_block_display_mode doc_block_display_mode_1" value="1" id="{0:s}.display.1" name="{0:s}.display.mode" />'.format(main_id),
		'<div class="doc_block_indicator hardlink_text"><span class="doc_block_indicator_inner"><label class="doc_block_indicator_text" for="{0:s}.display.1"></label><label class="doc_block_indicator_text" for="{0:s}.display.0"></label></span><a class="doc_block_indicator_hardlink hardlink" href="#{0:s}"></a></div>'.format(main_id),
	];


	# Header(s)
	src.append('<div class="doc_head">');
	for i in range(len(member_infos)):
		member_info = member_infos[i];
		member_name = member_info[0];
		member_attr = member_info[1];
		id = "{0:s}.{1:s}".format(__section_name, member_info[0]);

		src.append('<div class="doc_member_entry" id="{0:s}">'.format(id));

		if (member_object is not None):
			src.extend([
				'<span class="doc_obj">{0:s}</span>'.format(member_object),
				'<span class="doc_punct">.</span>',
			]);

		src.append(
			# '<span class="doc_member"><span><a class="doc_member_name" href="#{1:s}"><span>{0:s}</span></a>'.format(member_name, id)
			'<span class="doc_member"><span><label class="doc_member_name" for="{1:s}.display.1"><span>{0:s}</span></label>'.format(member_name, main_id)
		);

		if ("value" in member_attr):
			src.append(
				'=<span class="doc_member_value">{0:s}</span>'.format(repr(member_attr["value"]))
			);

		if ("type" in member_attr):
			src.append('<span class="doc_return_container"> : {0:s}</span>'.format(member_attr["type"], id));

		src.append('</span></span>');
		if (i + 1 < len(member_infos)):
			src.append(',');
		src.append('</div>');
	src.append('</div>');


	# Description
	if ("description" in extra_info):
		desc = extra_info["description"];
		description_id = "{0:s}.descriptions".format(main_id);

		src.append('<div class="doc_descriptions"><div class="doc_description doc_description_main">');
		src.append(desc);
		src.append('</div></div>');


	# Complete
	src.append('</div></li>');


	return u"".join(src);


def event_header(event_name, info):
	global __section_name;

	if (__section_name is None):
		this_section_name = "";
	else:
		this_section_name = __section_name + ".";

	main_id = "{0:s}{1:s}".format(this_section_name, info["id"]);


	# Setup
	src = [
		'<li><div class="doc_block" id="{0:s}"><input type="radio" class="doc_block_display_mode doc_block_display_mode_0" value="0" id="{0:s}.display.0" name="{0:s}.display.mode" checked /><input type="radio" class="doc_block_display_mode doc_block_display_mode_1" value="1" id="{0:s}.display.1" name="{0:s}.display.mode" />'.format(main_id),
		'<div class="doc_block_indicator hardlink_text"><span class="doc_block_indicator_inner"><label class="doc_block_indicator_text" for="{0:s}.display.1"></label><label class="doc_block_indicator_text" for="{0:s}.display.0"></label></span><a class="doc_block_indicator_hardlink hardlink" href="#{0:s}"></a></div>'.format(main_id),
	];


	# Header
	src.append('<div class="doc_head">');
	src.append('<div class="doc_member_entry" id="{0:s}">'.format(main_id));

	if ("object" in info and info["object"] is not None):
		src.extend([
			'<span class="doc_obj">{0:s}</span>'.format(info["object"]),
			'<span class="doc_punct">.</span>',
		]);

	src.append(
		'<span class="doc_member"><span><label class="doc_member_name" for="{1:s}.display.1"><span>{0:s}</span></label>'.format(event_name, main_id)
	);

	src.append('</span></span>');
	src.append('</div>');
	src.append('</div>');


	# Description
	if ("description" in info):
		desc = info["description"];
		description_id = "{0:s}.descriptions".format(main_id);

		src.append('<div class="doc_descriptions"><div class="doc_description doc_description_main">');
		src.append(desc);
		src.append('</div></div>');


	# Complete
	src.append('</div></li>');


	return u"".join(src);

