import * as d3 from "d3";
import { entry } from "../webpack.config";

// Helper functions
function range(size, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt);
}

function exportDocuments(topics) {
  let comm = new CommAPI("get_exported_documents", () =>
    alert(`Documents exported to python notebook.`)
  );

  comm.call({ topic_names: topics });
}

export function render(div_id, data) {
  // Style properties
  const size = { width: 600, height: 600 };
  const margin = { left: 50, right: 50, top: 50, bottom: 50 };
  const color = "steelblue";
  const titleColor = "black";
  const titleAltColor = "steelblue";

  // Default values
  let k = 5;
  let selected_topics = ["all"];
  const topic_names = Object.keys(data);

  function slice_data(data) {
    const new_data = [];
    // key = topic_name, value = arr of word counts
    for (let [key, value] of Object.entries(data)) {
      if (selected_topics.includes(key)) {
        new_data.push(value);
      }
    }
    const merged = [].concat
      .apply([], new_data)
      .reduce((acc, { word, count }) => {
        acc[word] ??= { word: word, count: 0 };
        acc[word].count += count;
        return acc;
      }, {});
    const sliced_data = Object.values(merged)
      .sort((a, b) => b.count - a.count)
      .slice(0, k);
    return sliced_data;
  }

  const sliced_data = slice_data(data);

  let x = (d) => d.count;
  let y = (d) => d.word;
  let X = d3.map(sliced_data, x);
  let Y = d3.map(sliced_data, y);

  let I = d3.range(X.length);

  let div = d3.select(div_id);

  // Selectors
  const menu_div = div.append("div").style("float", "left");

  const onChangeK = () => {
    const new_k = d3.select("#k-select").property("value");
    update_k(new_k);
  };

  function update_k(new_k) {
    k = new_k;
    updateChart(slice_data(data));
  }

  let k_label = menu_div
    .append("div")
    .append("label")
    .attr("for", "k_value")
    .text("Select k-value: ")
    .style("float", "left");

  let k_select = k_label
    .append("select")
    .attr("id", "k-select")
    .on("change", onChangeK);

  k_select
    .selectAll("option")
    .data(range(10, 1))
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d)
    .property("selected", (d) => d === k);

  const onChangeTopic = () => {
    const currentSelections = [];
    let opt;
    const opts = d3.select("#topic-select").property("options");
    console.log(opts);
    const len = opts.length;
    for (let key in opts) {
      opt = opts[key];
      if (opt.selected) {
        currentSelections.push(opt.value);
      }
    }

    updateTopics(currentSelections);
  };

  function updateTopics(new_topics) {
    selected_topics = new_topics;
    updateChart(slice_data(data));
  }

  let topic_label = menu_div
    .append("div")
    .append("label")
    .attr("for", "k_value")
    .text("Select topic(s): ")
    .style("float", "left");
  let topic_select = topic_label
    .append("select")
    .attr("id", "topic-select")
    .on("change", onChangeTopic)
    .attr("multiple", true);

  topic_select
    .selectAll("option")
    .data(topic_names)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d)
    .property("selected", (d) => d === selected_topics);

  let exportButton = menu_div
    .append("button")
    .text("Export")
    .on("click", () => {
      exportDocuments(selected_topics);
    });

  let svg = div
    .append("svg")
    .attr("width", size.width)
    .attr("height", size.height)
    .style("float", "left");
  // Scales

  let xDomain = [0, d3.max(X)];
  let xRange = [margin.left, size.width - margin.right];
  const xScale = d3.scaleLinear(xDomain, xRange);

  let yDomain = new d3.InternSet(Y);
  let yRange = [margin.top, size.height - margin.bottom];
  const yScale = d3.scaleBand(yDomain, yRange).padding(0.25);

  // Axes
  const xAxis = (g) =>
    g.attr("transform", `translate(0,${margin.top})`).call(d3.axisTop(xScale));

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .style("font-size", "12px");

  const xAxisUpdater = svg.append("g").call(xAxis);
  const yAxisUpdater = svg.append("g").call(yAxis);

  // Title

  svg
    .append("text")
    .attr("class", "title")
    .attr("x", size.width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .text(`Top ${k} words in newsgroup:${selected_topics}`);

  // Join data

  const updateChart = (new_data) => {
    svg
      .selectAll("text.title")
      .text(`Top ${k} words in newsgroup:${selected_topics}`);
    X = d3.map(new_data, x);
    Y = d3.map(new_data, y);
    I = d3.range(X.length);

    // Update axes
    xScale.domain([0, d3.max(X)]);
    yScale.domain(new d3.InternSet(Y));
    yAxisUpdater.call(yAxis);
    xAxisUpdater.call(xAxis);

    svg.selectAll("rect").remove();

    svg
      .append("g")
      .attr("fill", "steelblue")
      .selectAll("rect")
      .data(slice_data(data), (d) => d.word)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => xScale(0))
            .attr("y", (d) => yScale(d.word))
            .attr("height", yScale.bandwidth())
            .attr("width", (d) => xScale(d.count) - xScale(0)),
        (exit) => exit.remove()
      );
  };
  updateChart(sliced_data);
  return svg.node();
}
