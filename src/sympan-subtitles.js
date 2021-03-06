(function() {
	function stringToSeconds(t) {
		var s = 0.0
		if(t) {
		  var p = t.split(':');
		  for(i=0;i<p.length;i++)
			s = s * 60 + parseFloat(p[i].replace(',', '.'))
		}
		return s;
	}

	this.SymSubtitles = function () {
		this.lines = [];
		this.currentLine = -1;
		this.emptyLine = {'index': 0, 'text': '', 'start': 0, 'end': 0}
	}
	
	var emptyLine = {'index': 0, 'text': '', 'start': 0, 'end': 0};
	
	SymSubtitles.prototype = {
		current: function(property) {
			var line = this.currentLine==-1 ? this.emptyLine : this.lines[this.currentLine];
			if( !property ) {
				return line;
			}
	
			return line[property];
		},
		seek: function(time) {
			if( this.lines.length < 1 ) {
				this.currentLine = -1;
				return this;
			}
	
			// Do nothing if the line is synced
			if ( this.currentLine >= 0 && this.lines[this.currentLine].start < time && time < this.lines[this.currentLine].end ) {
				return this;
			}
	
			// Try fast-forward to the next line
			if ( this.currentLine < this.lines.length-1 && this.lines[this.currentLine+1].start < time && time < this.lines[this.currentLine+1].end ) {
				this.currentLine += 1;
				return this;
			}
	
			// Use binary search
			this.currentLine = -1;
			var index = Math.ceil(this.lines.length/2);
			var step = index;
	
			while( index < this.lines.length && index >= 0 ) {
				step = step/2;
		
				if( this.lines[index].start < time && time < this.lines[index].end ) {
					this.currentLine = index;
					break;
				} else if( step < 1) {
					break;
				} 
				step = Math.ceil(step)
				if( this.lines[index].start < time ) {
					index += step;
				} else {
					index -= step;
				}
			}
	
			// Check last line
			if ( index >= this.lines.length && time < this.lines[this.lines.length-1].end && this.lines[this.lines.length-1].start < time ) {
				this.currentLine = this.lines.length-1;
			}
	
			return this;
		},
		fromString: function(string) {
			var result = [];
			var blocks = string.replace(/\n+$/, '').split(/\n{2,}/);
			for( index in blocks ) {
				block_line = blocks[index].split(/^(\d+)\n(.*?) --> (.*?)\n([\w\W]*)$/)
				if (block_line.length < 6) continue;
				result.push({
					'index': block_line[1], 
					'start': stringToSeconds(block_line[2]), 
					'end': stringToSeconds(block_line[3]), 
					'text': block_line[4].replace('\n', '<br />\n')
				});
			}
			this.lines = result;
			this.currentLine = 0;
			this.trigger('onUpdate', {updateType: 'fromString'});
			return this;
		}
	};
	
	Sympan.fn.subtitles = function() {
		var self = this;
		
		if( this.data('__subtitles__') ) {
			return this.data('__subtitles__');
		}
		
		var subtitles = new SymSubtitles();
		this.data('__subtitles__', subtitles);
		
		this.onProgress(function(e) {
			if( subtitles.currentLine != subtitles.seek(e.currentTime).currentLine ) {
				subtitles.trigger('onChange');
			}
		});
		
		return subtitles;
	}

	Sympan.registerEvent(SymSubtitles.prototype, 'onUpdate onChange');

})();
