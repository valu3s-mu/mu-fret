// Copyright © 2025, United States Government, as represented by the Administrator of the National Aeronautics and Space Administration. All rights reserved.
// 
// The “FRET : Formal Requirements Elicitation Tool - Version 3.0” software is licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0. 
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
import math from 'mathjs'
import React from 'react'
import PropTypes from 'prop-types';
import * as d3 from 'd3'
import Grid from '@material-ui/core/Grid';
import CounterexampleTable from './CounterexampleTable';

import { DiagnosisContext } from './DiagnosisProvider';

const constants = require('../parser/Constants');

class ChordDiagram extends React.Component {
	static contextType = DiagnosisContext;
	state = {
		allConflicts : [],
		currentConflicts : [],
		cexTableData : {},
		colors : []
	}

	optLog(str) {if (constants.verboseRealizabilityTesting) console.log(str)}

	createD3() {		
		const {setMessage} = this.context;
		var chordObj = this;		
	    const { selectedReport } = this.props


		var width = 400,
		    height = 500,
		    innerRadius = 100,
		    outerRadius = 105;

		//Remove previous svg before appending new.
	    d3.select(this.refs.anchor).selectAll("*").remove();

		var svg = d3.select(this.refs.anchor)
					.append("svg:svg")
			    		.attr("width", width)
			    		.attr("height", height)
						.append("svg:g")
			    		.attr("transform", "translate(" + (200)  + "," + (250) + ")")

		//parse JSON file and create diagram
		var content = selectedReport;
		this.optLog(content)
		// d3.json(selectedReport, function(error, content) {

			//used to align diagram in window
			function startAngle(d) { return d.startAngle + offset; }
			function endAngle(d) { return d.endAngle + offset; }

			//event handler for on click actions.
			function fadeIn(opacity) {
			  return function(d, i) {
			    svg.selectAll("path.chord")
			        .filter(function(d) { return d.source.index != i && d.target.index != i; })
					.transition()
			        .style("stroke-opacity", opacity)
			        .style("fill-opacity", opacity);
				svg.selectAll("path.chord")
			        .filter(function(d) { return d.source.index === i || d.target.index === i; })
					.transition()
			        .style("stroke-opacity", .8)
			        .style("fill-opacity", .8);

			    var reqs = '';
				let conflictNamesJoined = conflictNames.filter(name => name !== '').map(name => Array.isArray(name) ? name.join('') : name)

				if (i > conflictNames.length -1) {
					var nameoffset = i - conflictNames.length;
					var data = requirementConflicts[requirementNames[nameoffset]].sort();

					let dataJoined = data.map(d => Array.isArray(d) ? d.join('') : d);
					const conflictColors = colors.filter(c => dataJoined.includes(conflictNamesJoined[colors.indexOf(c)]))

					chordObj.setState({
						allConflicts : conflictNamesJoined,
						currentConflicts : dataJoined,
						cexTableData : cexTables,
						colors : conflictColors
					})
					reqs = data[0];
					setMessage({reqs : reqs, color : conflictColors[0]})
				} else {
					var data = [conflictNames[i]].sort();
					let dataJoined = data.map(d => Array.isArray(d) ? d.join('') : d);
					const conflictColors = colors.filter(c => dataJoined.includes(conflictNamesJoined[colors.indexOf(c)]))

					chordObj.setState({
						allConflicts : conflictNamesJoined,
						currentConflicts : dataJoined,
						cexTableData : cexTables,
						colors : conflictColors
					})
					reqs = conflictNames[i];
					setMessage({reqs : reqs, color : conflictColors[0]})
				}			
			  };
			}

			function createCDMatrix(names, requirementNames) {
				var matrix = math.zeros(names.length, names.length);
				matrix.forEach(function (value, index, matrix) {
				  if (names[index[0]] !== "" & names[index[1]] !== "" & names[index[0]] !== names[index[1]]) {
					var tmpName0 = names[index[0]];
					var tmpName1 = names[index[1]];
					if (tmpName1.includes(tmpName0) || tmpName0.includes(tmpName1)) {
				  		if (!(requirementNames.includes(names[index[1]]) & requirementNames.includes(names[index[0]]))) {
				  			matrix.subset(math.index(index[0],index[1]), 1);
				  		}
				  	}
				  }
				})
				return matrix;
			}
			
			//generate random colors. better than above as it creates distinct values at all times.
			var randomColor = (function(){
			  var golden_ratio_conjugate = 0.618033988749895;
			  var h = Math.random();

			  var hslToRgb = function (h, s, l){
			      var r, g, b;

			      if(s == 0){
			          r = g = b = l; // achromatic
			      }else{
			          function hue2rgb(p, q, t){
			              if(t < 0) t += 1;
			              if(t > 1) t -= 1;
			              if(t < 1/6) return p + (q - p) * 6 * t;
			              if(t < 1/2) return q;
			              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			              return p;
			          }

			          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			          var p = 2 * l - q;
			          r = hue2rgb(p, q, h + 1/3);
			          g = hue2rgb(p, q, h);
			          b = hue2rgb(p, q, h - 1/3);
			      }

			      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
			  };
			  
			  return function(){
			    h += golden_ratio_conjugate;
			    h %= 1;
			    return hslToRgb(h, 0.5, 0.60);
			  };
			})();

		  	//populate these to make 2d matrix for diagram
		  	var requirementNames = [];
		  	var conflictNames = [];
		  	// var propNames = Object.keys(content.Dependencies);
		  	var propNames = content.Requirements;
		  	for (var i = 0; i < propNames.length; i++) {
			    	var contains = false;
			    	var propName = propNames[i];
			    for (var j = 0; j < content.Conflicts.length; j++) {
				  let parsedConflict = content.Conflicts[j].Conflict;
				  if (parsedConflict.includes(propName)) {
			        contains = true;
			      }
			    }
			    if (contains) {
			      requirementNames.push(propName);
			    }
		  	}
		  	
		  	for (var i = 0; i < content.Conflicts.length; i++) {
				let parsedConflict = content.Conflicts[i].Conflict;
				conflictNames.push(parsedConflict);
		  	}
			this.optLog("Conflict names:")
			this.optLog(conflictNames)

			requirementNames.sort();
			conflictNames.sort();

			var counterexamples = content.Counterexamples;
			var cexTables = {};

			//map from req -> cexs
			var requirementCexs = {};

			//map from req -> conflicts
			var requirementConflicts = {};

			//initialize array values in requirementCexs
			for (var i = 0; i < requirementNames.length; i++) {
				requirementCexs[requirementNames[i]] = [];
				requirementConflicts[requirementNames[i]] = [];
			}

			//create dependency map for requirement -> list of cexs
			for (var i = 0; i < counterexamples.length; i++) {
				var conflict = counterexamples[i].requirements;
				var cex = counterexamples[i];
				//The check below is to support older reports where 'conflict' was an array string, including braces.
				console.log(conflict)
				let conflictID = Array.isArray(conflict) ? conflict.join('') : conflict;				
				console.log("ConflictID:")
				console.log(conflictID)
				cexTables[conflictID] = cex;
				for (var j = 0; j < requirementNames.length; j++) {
					if (conflict.includes(requirementNames[j])) {
						requirementCexs[requirementNames[j]].push(cex);
						requirementConflicts[requirementNames[j]].push(conflict);
					}
				}
			}


			requirementNames.push("");
			this.optLog("Requirement names:")
			this.optLog(requirementNames)
			conflictNames.push("");
			var names = conflictNames;
			names = names.concat(requirementNames);
			this.optLog("Names:")
			this.optLog(names)

			//2d matrix to be used for diagram. Both rows and columns contain the req names, then the conflicts, in that order. Empty values are necessary to split the circle into two arcs.
			var matrix = createCDMatrix(names, requirementNames);
			
			//Calculate the total sum of the chord values. This is used to define the offset that rotates the diagram in such a way that the two
			//arcs are aligned horizontally with the screen.
			var submatrix = matrix.subset(math.index(math.range(0, conflictNames.length - 1), math.range(conflictNames.length, names.length - 1)));
			var sum = math.sum(submatrix);
			var emptyPerc = 0.5;
			var emptyStroke = Math.round(sum * emptyPerc);

			matrix.subset(math.index(conflictNames.length - 1, names.length -1), emptyStroke);
			matrix.subset(math.index(names.length - 1, conflictNames.length - 1), emptyStroke);

			for (var j = 0; j < conflictNames.length; j++) {
				for (var i = 0; i < names.length - 1; i++) {
					if (names[i] === conflictNames[j] & names[i] !== "") {
						names[i] = "Conflict " + (i+1);
					}
				}
			}

			var offset = Math.PI * (emptyStroke / (sum + emptyStroke)) / 2;

			var colors = [];
			for (var j = 0; j < conflictNames.length - 1; j++) {
				colors.push(randomColor());
			}

			//chord diagram creation
			var chorddiag = d3.chord()(matrix.valueOf());

			var fill = d3.scaleOrdinal()
			    .domain(d3.range(names.length))
			    .range(colors);

			var arc = d3.arc()
			    .innerRadius(innerRadius)
			    .outerRadius(outerRadius)
			    .startAngle(startAngle)
			    .endAngle(endAngle);

	        var g = svg
				.datum(chorddiag)
				.append("g")
				.selectAll("g")
				.data(function(d) { return d.groups;})
				.enter()
				.append("g")
					.attr("class", "group").on("click", fadeIn(.02))
			g.append("path")
				.style("stroke", function(d) { return (names[d.index] === "" ? "none" : "black")})
		  		.style("fill", function(d) { return (names[d.index] === "" ? "none" : (requirementNames.includes(names[d.index]) ?  "#D3D3D3" : fill(d.index))); })
		  		.style("cursor", "pointer")
		  		.attr("d", arc)
				//.attr("id",function(d){return "qa_chordDia_svg_path_"+names[d.index];})

			var tooltip = d3.select("body")
				.append("div")
				.attr("class", "tooltip")
				.style("width","max-content")
				.style("position", "absolute")
				.style("z-index", "10")
				.style("visibility", "hidden");


			//Labeling sections on the arcs
			g.append("svg:text")
				.each(function(d) { d.angle = ((d.startAngle + d.endAngle) / 2) + offset;})
				.attr("dy", ".35em")
				.style("font-size", "12px")
				.style("cursor", "pointer")
				.style("text-overflow", "ellipsis")
				.attr("class", "titles")
				.attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
				.attr("transform", function(d) {
					return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
					+ "translate(" + (innerRadius + 40) + ")"
					+ (d.angle > Math.PI ? "rotate(180)" : "");
		  		})
			    .attr("id",function(d,i){return "qa_chordDia_svg_text_reqId_"+names[i].replace(/\s+/g, '_');})
		  		.text(function(d,i) { return names[i]; })
				  .on("mouseover", function(d, i){tooltip.text(names[i]); return tooltip.style("visibility", "visible");})
				  .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
				  .on("mouseout", function(){return tooltip.style("visibility", "hidden");});


			//Inner chords		  
			svg
				.datum(chorddiag)
				.append("g")
				.selectAll("path")
				.data(function(d) {return d;})
				.enter()
				.append("path")
					.attr("class", "chord")
					.style("stroke", function(d) { return d3.rgb(fill(d.source.index)).darker(); })
					.style("fill", function(d) { return fill(d.source.index); })
					.style("opacity", function(d) { return (names[d.source.index] === "" ? 0 : 0.8); })
					.attr("d", d3.ribbon().radius(innerRadius).startAngle(startAngle).endAngle(endAngle));
		// });
	}

	componentDidUpdate(prevProps, prevState) {
		if(prevProps.selectedReport.Requirements.toString() !== this.props.selectedReport.Requirements.toString()) {
			this.optLog(prevProps)
			this.optLog(this.props)
			this.setState({cexTableData : []});
			this.createD3()
		}
	}

	componentDidMount() {
		this.createD3()
	}

	render() {
		let diagram;
	    diagram =(
	    	<Grid>
	    	{
	      	<div ref="anchor"/>
	    	}
	    	</Grid>
		);		
	    let table;
	    if (Object.keys(this.state.cexTableData).length !== 0) {
	    	this.optLog(this.state.cexTableData);
	    	table = (
	    		<Grid>
	    			<CounterexampleTable
	    				allConflicts={this.state.allConflicts} 
	    				currentConflicts={this.state.currentConflicts}
	    				cexTableData={this.state.cexTableData}
	    				colors={this.state.colors}
	    				project={this.props.selectedProject}
	    				requirements={this.props.requirements}
    				/>
	          	</Grid>);
	    }

	    return(
			<Grid container justifyContent="space-evenly" spacing={10}>
				{diagram}
				{table}
			</Grid>					
	    )
	}
}

ChordDiagram.propTypes = {
  selectedReport: PropTypes.object.isRequired,
  selectedProject: PropTypes.string.isRequired,
  requirements: PropTypes.array.isRequired
}
export default ChordDiagram
