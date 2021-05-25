function downloadData(data=[{}], xCol = '',tag=''){
    const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
    var header = Object.keys(data[0])
    var outputCSV = [
      header.join(','), // header row first
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n')

    // Button Preparation
    var colDiv = document.querySelector("#"+tag+'_'+xCol);

    var downloadLink = document.querySelector("#"+tag+'_'+xCol+"_csv");
    if (downloadLink) {
      console.log("Remove old download data")
      colDiv.removeChild(downloadLink);
    }

    // Create Button
    downloadButton=document.createElement('a');
    downloadButton.className = "d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm";
    downloadButton.id = tag+'_'+xCol+"_csv";
    downloadButton.textContent='Download Data';
    downloadButton.download=tag+'_'+xCol+".csv";
    downloadButton.href='data:text/csv;charset=utf-8,'+escape(outputCSV);
    colDiv.appendChild(downloadButton);
  }