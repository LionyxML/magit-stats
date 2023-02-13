import * as echarts from "echarts";
import { applySpec, prop } from "ramda";
import { truncateString, weekDayNameShort } from "../utils";

// TODO: proper typing
interface chartProps {
  data: any;
  chartType: any;
}

export const renderChart = ({ data, chartType }: chartProps) => {
  if (chartType === "COMMITS_BY_AUTHOR") {
    const chart = echarts.init(null, undefined, {
      renderer: "svg",
      ssr: true,
      width: 400,
      height: 300,
    });

    chart.setOption({
      series: [
        {
          type: "pie",
          avoidLabelOverlap: false,
          data: data.map(
            applySpec({
              value: prop("authorCommits"),
              name: (entry) => truncateString(prop("name", entry), 13),
              id: prop("email"),
            }),
          ),
          radius: "50%",
        },
      ],
    });

    const chartImage = chart.renderToSVGString();

    chart.dispose();

    return chartImage;
  }

  if (chartType === "COMMITS_BY_HOUR") {
    const chart = echarts.init(null, undefined, {
      renderer: "svg",
      ssr: true,
      width: 400,
      height: 300,
    });

    chart.setOption({
      xAxis: {
        type: "category",
        data: data.map((entry: any) => entry.hour),
        axisLabel: {
          interval: 0,
          rotate: 90,
        },
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: data.map((entry: any) => entry.commits),
          type: "bar",
        },
      ],
    });

    const chartImage = chart.renderToSVGString();

    chart.dispose();

    return chartImage;
  }

  if (chartType === "COMMITS_BY_WEEKDAY") {
    const chart = echarts.init(null, undefined, {
      renderer: "svg",
      ssr: true,
      width: 400,
      height: 300,
    });

    chart.setOption({
      xAxis: {
        type: "category",
        data: data.map((entry: any) => weekDayNameShort(entry.weekDay)),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: data.map((entry: any) => entry.commits),
          type: "bar",
        },
      ],
    });

    const chartImage = chart.renderToSVGString();

    chart.dispose();

    return chartImage;
  }
};
