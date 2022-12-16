/*
Class to handle interactive plot with computed orbital energies
*/

import addToggleCallbacks from './button.js';

export default class Plot {
  #chartElement;
  #chart;
  #tooltipElement;
  #matrixElement;
  #data;
  #colorData;
  #sigma = true;
  #pi = true;
  #hoverCB;
  #controlsElement;
  #lastIndex = 0;

  /*
  Formats numbers to set number of decimal places
  */
  static #format(x, precision=2) {
    return Math.round(x * 10**precision) / (10**precision);
  }

  /*
  Constructor for plot
  @param data The computed AOM data
  @param parent The parent element to contain the output
  @param hoverCB A callback to be called when the plot is hovered on
  */
  constructor(data, parent=document.body, hoverCB=null) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');
    parent.appendChild(wrapper);

    const matrixWrapper = document.createElement('div');
    matrixWrapper.classList.add('matrices');
    parent.appendChild(matrixWrapper);

    const arrowElement = document.createElement('i');
    arrowElement.classList.add('fa-solid');
    arrowElement.classList.add('fa-arrow-right');
    arrowElement.classList.add('arrow');
    matrixWrapper.appendChild(arrowElement);

    this.#data = data;

    this.#hoverCB = hoverCB;

    let seedColor = Math.random() * 360;
    this.#colorData = Array.from([1,2,3,4,5], i=>`hsl(${(seedColor + 137*i)%360},75%,50%)`);

    this.#chartElement = document.createElement('canvas');
    wrapper.appendChild(this.#chartElement);

    this.#controlsElement = document.createElement('div');
    const controlsElement = this.#controlsElement;
    controlsElement.classList.add('controls');
    controlsElement.innerHTML = `
      <div class="button toggle selected sigma">&sigma;</div>
      <div class="button toggle selected pi">&pi;</div>
      <div class="button export">Export CSV</div>`;
    addToggleCallbacks(controlsElement);
    controlsElement.getElementsByClassName('sigma')[0].addEventListener('click', ()=> {
      this.sigma = !this.sigma;
    });
    controlsElement.getElementsByClassName('pi')[0].addEventListener('click', ()=> {
      this.pi = !this.pi;
    });
    controlsElement.getElementsByClassName('export')[0].addEventListener('click', () => {
      this.#csv();
    });
    parent.appendChild(controlsElement);

    this.#tooltipElement = document.createElement('ul');
    this.#tooltipElement.classList.add('matrix');
    this.#tooltipElement.classList.add('tooltip');
    this.#tooltipElement.style = "--rows: 5; --cols:1;";
    for (let i=0; i<5; i++) {
      const value = Plot.#format(this.#data.sigmaEnergies[0][i] * this.#sigma + this.#data.piEnergies[0][i] * this.#pi);
      const element = document.createElement('li');
      element.innerHTML = value;
      this.#tooltipElement.appendChild(element);
    }
    matrixWrapper.appendChild(this.#tooltipElement);

    this.#matrixElement = document.createElement('ul');
    this.#matrixElement.classList.add('matrix');
    this.#matrixElement.style = "--rows: 5; --cols:5;";
    for (let c=0; c<5; c++) {
      for (let r=0; r<5; r++) {
        const value = Plot.#format(this.#data.sigmaMatrices[0][r][c] + this.#data.piMatrices[0][r][c]);
        const element = document.createElement('li');
        element.innerHTML = value;
        this.#matrixElement.appendChild(element);
      }
    }
    matrixWrapper.append(this.#matrixElement);

    this.#chart = new Chart(this.#chartElement, {
      type: 'line',
      data: {
        labels: Array.from([...Array(data.steps).keys()], i => Plot.#format(i/(data.steps - 1))),
        datasets: Array.from([0,1,2,3,4], i => ({
          data: data.energies.map(arr => Plot.#format(arr[i])),
          borderColor: this.#colorData[i]
        }))
      },
      options: {
        font: {
          family: "'monospace'",
        },
        pointRadius: 0,
        hoverRadius: 0,
        borderWidth: 2,
        animationDuration: 0,
        ticks: {
          precision: 3,
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
            external: ()=>{}
          }
        }
      },
      plugins: [{
        afterDraw: (()=>{
          let lastX = -1;
          return (chart => {
            if (this.#chart.tooltip?._active?.length) lastX = this.#chart.tooltip._active[0].element.x;
            if (lastX == -1) return;
            const x = lastX;
            const yAxis = this.#chart.scales.y;
            const ctx = this.#chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, yAxis.top);
            ctx.lineTo(x, yAxis.bottom);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'hsl(0, 0, 50%)';
            ctx.stroke();
            ctx.restore();
            this.#lastIndex = this.#chart.scales.x.getValueForPixel(x);
            this.#update();
          });
        })(),
      }],
    });

    parent.appendChild(wrapper);
  }

  /*
  Determines if sigma effects are shown
  */
  set sigma(sigma) {
    sigma = Boolean(sigma)
    this.#sigma = sigma;
    this.#controlsElement.getElementsByClassName('sigma')[0].classList.toggle('selected', sigma);
    this.#update(true);
  }

  get sigma() {
    return this.#sigma;
  }

  /*
  Determines if pi effects are shown
  */
  set pi(pi) {
    pi = Boolean(pi)
    this.#pi = pi;
    this.#controlsElement.getElementsByClassName('pi')[0].classList.toggle('selected', pi);
    this.#update(true);
  }

  get pi() {
    return this.#pi;
  }

  /*
  Updates data with new AOM results
  */
  set data(data) {
    this.#data = data;
    this.#update(true);
  }

  /*
  Updates the plot
  @param updateData Was the AOM data updated?
  */
  #update(updateData) {
    this.#matrixElement.innerHTML = '';
    for (let c=0; c<5; c++) {
      for (let r=0; r<5; r++) {
        const value = Plot.#format(this.#data.sigmaMatrices[this.#lastIndex][r][c] * this.#sigma + this.#data.piMatrices[this.#lastIndex][r][c] * this.#pi);
        const element = document.createElement('li');
        element.innerHTML = value;
        this.#matrixElement.appendChild(element);
      }
    }

    if(this.#hoverCB) {
      this.#hoverCB(1 - (this.#lastIndex / (this.#data.steps - 1)));
    }

    for (let i=0; i<5; i++) {
      const value = Plot.#format(this.#data.sigmaEnergies[this.#lastIndex][i] * this.#sigma + this.#data.piEnergies[this.#lastIndex][i] * this.#pi);
      this.#tooltipElement.children[i].innerHTML = value;
      this.#tooltipElement.children[i].style = `--color: ${this.#colorData[i]}`;
    }

    if (Boolean(updateData)) {
      this.#chart.data.datasets = Array.from([0,1,2,3,4], i => ({
        data: Array.from([...Array(this.#data.steps).keys()], j => {
          return Plot.#format(this.#data.sigmaEnergies[j][i] * this.#sigma + this.#data.piEnergies[j][i] * this.#pi)
        }),
        borderColor: this.#colorData[i]
      }));
      this.#chart.update();
    }
  }

  /*
  Generates a CSV file from the AOM data and prompts the user to save it
  */
  #csv() {
    const rows = [['reaction coordinate',
    'esigma_1', 'esigma_2', 'esigma_3', 'esigma_4', 'esigma_5',
    'epi_1', 'epi_2', 'epi_3', 'epi_4', 'epi_5',
    'sigma_11', 'sigma_12', 'sigma_13', 'sigma_14', 'sigma_15',
    'sigma_21', 'sigma_22', 'sigma_23', 'sigma_24', 'sigma_25',
    'sigma_31', 'sigma_32', 'sigma_33', 'sigma_34', 'sigma_35',
    'sigma_41', 'sigma_42', 'sigma_43', 'sigma_44', 'sigma_45',
    'sigma_51', 'sigma_52', 'sigma_53', 'sigma_54', 'sigma_55',
    'pi_11', 'pi_12', 'pi_13', 'pi_14', 'pi_15',
    'pi_21', 'pi_22', 'pi_23', 'pi_24', 'pi_25',
    'pi_31', 'pi_32', 'pi_33', 'pi_34', 'pi_35',
    'pi_41', 'pi_42', 'pi_43', 'pi_44', 'pi_45',
    'pi_51', 'pi_52', 'pi_53', 'pi_54', 'pi_55']]
    for (let i=0; i<this.#data.steps; i++) {
      const f = i / (this.#data.steps - 1);
      const sigma = [];
      const pi = [];
      const row = [f];

      for (let j=0; j<5; j++) row.push(this.#data.sigmaEnergies[i][j]);
      for (let j=0; j<5; j++) row.push(this.#data.piEnergies[i][j]);

      for (let r=0; r<5; r++)
        for (let c=0; c<5; c++)
          row.push(this.#data.sigmaMatrices[i][r][c]);

      for (let r=0; r<5; r++)
        for (let c=0; c<5; c++)
          row.push(this.#data.piMatrices[i][r][c]);

      rows.push(row);
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const hiddenLink = document.createElement('a');
    hiddenLink.href = encodeURI(csvContent);
    hiddenLink.target = '_blank';
    hiddenLink.download = 'aom.csv';
    hiddenLink.click();
  }
}
