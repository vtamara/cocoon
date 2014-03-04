(function($) {

  var cocoon_element_counter = 0;

  var create_new_id = function() {
    return (new Date().getTime() + cocoon_element_counter++);
  }
  
  var newcontent_braced = function(id) {
    return '[' + id + ']$1';
  }
  
  var newcontent_underscord = function(id) {
    return '_' + id + '_$1';
  }

  /**
   * Add fields in the page
   * @param {object} $this  Button in jquery that fired the request
   * @param {Array.<number>} new_ids New identifications for fields to add,
   *   	index starting at 0 and there are count
   * @param {number} count Amount of fields to add
   * @param {string} content $this.data('association-insertion-template')
   */
  var add_fields = function($this, new_ids, count, content) {
    var assoc                 = $this.data('association'),
        assocs                = $this.data('associations'),
        insertionMethod       = $this.data('association-insertion-method') || $this.data('association-insertion-position') || 'before',
        insertionNode         = $this.data('association-insertion-node'),
        insertionTraversal    = $this.data('association-insertion-traversal'),
        regexp_braced         = new RegExp('\\[new_' + assoc + '\\](.*?\\s)', 'g'),
        regexp_underscord     = new RegExp('_new_' + assoc + '_(\\w*)', 'g'),
        new_content           = content.replace(regexp_braced, newcontent_braced(new_ids[0])),
        new_contents          = [];

    if (new_content == content) {
      regexp_braced     = new RegExp('\\[new_' + assocs + '\\](.*?\\s)', 'g');
      regexp_underscord = new RegExp('_new_' + assocs + '_(\\w*)', 'g');
      new_content       = content.replace(regexp_braced, newcontent_braced(new_ids[0]));
    }

    new_content = new_content.replace(regexp_underscord, newcontent_underscord(new_ids[0]));
    new_contents = [new_content];

    for(i = 1; i<count; i++) {
      new_content = content.replace(regexp_braced, newcontent_braced(new_ids[i]));
      new_content = new_content.replace(regexp_underscord, newcontent_underscord(new_ids[i]));
      new_contents.push(new_content);
    }
    
    if (insertionNode){
      if (insertionTraversal){
        insertionNode = $this[insertionTraversal](insertionNode);
      } else {
        insertionNode = insertionNode == "this" ? $this : $(insertionNode);
      }
    } else {
      insertionNode = $this.parent();
    }

    for (var i in new_contents) {
      var contentNode = $(new_contents[i]);

      insertionNode.trigger('cocoon:before-insert', [contentNode]);

      // allow any of the jquery dom manipulation methods (after, before, append, prepend, etc)
      // to be called on the node.  allows the insertion node to be the parent of the inserted
      // code and doesn't force it to be a sibling like after/before does. default: 'before'
      var addedContent = insertionNode[insertionMethod](contentNode);

      insertionNode.trigger('cocoon:after-insert', [contentNode]);
    }
  }

  $(document).on('click', '.add_fields', function(e) {
    e.preventDefault();
    var $this                 = $(this),
	assoc                 = $this.data('association'),
        count                 = parseInt($this.data('count'), 10),
        content               = $this.data('association-insertion-template');
    count = (isNaN(count) ? 1 : Math.max(count, 1));
    if ($this.data("ajax") && count == 1) {
      // For the moment ajax when adding 1 element, so function that
      // answers AJAX request is easier.
      var cid = $this.data("ajaxdata");
      var mdata = {};
      mdata[cid] = $('#' + cid).val();
      var regexp_inputid = new RegExp('<input .*id="[^"]*_' + assoc + '_id"', 'g');

      $.ajax($this.data("ajax"), {
        type: 'GET',
        dataType: 'json', 
        data: mdata
      }).done(function(new_id) { 
        var new_content = content.replace(regexp_inputid, 
	  '$& value="' + new_id + '" ');
        add_fields($this, [new_id], 1, new_content); 
      }).fail(function(jqXHR, textStatus) {
        alert( "Cocoon request failed: " + textStatus );
      });
    } else {
        new_ids=[];
	for(i = 0; i<count; i++) {
    		new_ids[i] = create_new_id();
	}
    	add_fields($this, new_ids, count, content);
    }
  });
    
 
  _cocoon_remove_fields = function($this) {
    var wrapper_class = $this.data('wrapper-class') || 'nested-fields',
        node_to_delete = $this.closest('.' + wrapper_class),
        trigger_node = node_to_delete.parent();

    trigger_node.trigger('cocoon:before-remove', [node_to_delete]);

    var timeout = trigger_node.data('remove-timeout') || 0;
    var cancel = node_to_delete.data('remove-cancel') == "true";
    if (!cancel) {
	    setTimeout(function() {
		    if ($this.hasClass('dynamic')) {
			    node_to_delete.remove();
		    } else {
			    $this.prev("input[type=hidden]").val("1");
			    node_to_delete.hide();
		    }
		    trigger_node.trigger('cocoon:after-remove', [node_to_delete]);
	    }, timeout);
    }
  }
  $(document).on('click', '.remove_fields.dynamic, .remove_fields.existing', 
		  function (e) { 
			  e.preventDefault();
			  _cocoon_remove_fields($(this))
		  }
	  );

  $('.remove_fields.existing.destroyed').each(function(i, obj) {
    var $this = $(this),
        wrapper_class = $this.data('wrapper-class') || 'nested-fields';

    $this.closest('.' + wrapper_class).hide();
  });

})(jQuery);
