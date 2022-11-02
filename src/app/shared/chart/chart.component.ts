import { 
  Component, OnInit, ElementRef,
  ViewChild, HostListener, AfterViewInit,
  Input } from '@angular/core';
import * as echarts from 'echarts';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {
  @ViewChild('chart') chart!: ElementRef;
  eChart!: echarts.ECharts;
  @Input('items') items: {name: string, value: number}[] = [];
  @Input('titleText') titleText = '';
  @Input('titleSubtext') titleSubtext = '';
  @Input('seriesName') seriesName = '';
  @Input('chartType') chartType = '';

  constructor(
    private _userSettings: UserSettingsService) { }

  ngOnInit(): void {
  }

  loadChart(items: {name: string, value: number}[], theme = '') {
    if (this.eChart) {
      echarts.dispose(this.eChart);
    }
    this.eChart = echarts.init(this.chart.nativeElement, theme);
    
    
    // Specify the configuration items and data for the chart
    var option: any = {
      title: {
        text: this.titleText,
        subtext: this.titleSubtext,
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      series: [],
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      label: {
        formatter: '{d}%'
      },
    };

    if (this.chartType === 'pie') {
      option.series.push({
        name: this.seriesName,
        type: this.chartType,
        radius: '62%',
        data: items,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      });
    }

    // Display the chart using the configuration items and data just specified.
    this.eChart.setOption(option);
  }


  resizeChart() {
    if (this.eChart) {
      this.eChart.resize();
    }
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event: UIEvent) {
    this.resizeChart();
  }

  ngAfterViewInit() {
    let theme = '';
    const current = this._userSettings.getDefaultTheme();
    if (current.indexOf('dark') >= 0) {
      theme = 'dark';
    }
    this._userSettings.defaultThemeStream.subscribe((theme) => {
      let newTheme = '';
      if (theme.indexOf('dark') >= 0) {
        newTheme = 'dark';
      }
      this.loadChart(this.items, newTheme);
    })
    this.loadChart(this.items, theme);
  }



}
