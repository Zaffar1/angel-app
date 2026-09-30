import React from "react";
import ReactECharts from "echarts-for-react";

const titleStyle = {
  color: "#333",
  fontStyle: "normal",
  fontWeight: "bold",
  fontFamily: "Arial",
  fontSize: 32,
};
const SalesChart = ({ data }) => {
  const option = {
    title: {
      text: "Sales",
    },
    xAxis: {
      type: "category",
      data: data.categories,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: data.values,
        type: "line",
        stack: "total",
      },
    ],
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-md">
      <ReactECharts option={option} style={{ width: "100%" }} theme={""} />
    </div>
  );
};

const DonutChart = ({ data }) => {
  const option = {
    title: {
      text: "Overview",
      //   subtext: "Users, Missions, Bookings, Sales",
      left: "left",
    },
    titleStyle: titleStyle,
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      left: "right",
    },
    series: [
      {
        name: "Overview",
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          //   position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "30",
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: true,
        },
        data: data,
      },
    ],
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-md">
      <ReactECharts option={option} />
    </div>
  );
};

export { SalesChart, DonutChart };
