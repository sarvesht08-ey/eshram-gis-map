import * as XLSX from 'xlsx';

self.onmessage = async (e) => {
  const { file } = e.data;

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Normalize keys
    const normalizedData = rawData.map(row => {
      const newRow = { ...row };
      // Map new uppercase keys to internal keys
      if (newRow['DISTRICT']) {
        newRow['Location Name'] = newRow['DISTRICT'];
        newRow['District'] = newRow['DISTRICT'];
      }
      if (newRow['PIN_CODE']) newRow['PIN code'] = newRow['PIN_CODE'];
      if (newRow['COVERAGE_PERCENT']) newRow['Coverage Status'] = newRow['COVERAGE_PERCENT'];
      if (newRow['LATITUDE']) newRow['Latitude'] = newRow['LATITUDE'];
      if (newRow['LONGITUDE']) newRow['Longitude'] = newRow['LONGITUDE'];
      if (newRow['STATE']) newRow['State'] = newRow['STATE'];
      if (newRow['TSP']) newRow['TSP'] = newRow['TSP'];
      if (newRow['TECHNOLOGY']) newRow['Technology'] = newRow['TECHNOLOGY'];

      // Worker Data Mapping
      if (newRow['TOTAL_WORKER']) newRow['Total Worker'] = newRow['TOTAL_WORKER'];
      if (newRow['MALE_WORKER']) newRow['Male Worker'] = newRow['MALE_WORKER'];
      if (newRow['FEMALE_WORKER']) newRow['Female Worker'] = newRow['FEMALE_WORKER'];
      if (newRow['AGE_BETWEEN_18_TO_25']) newRow['Age 18-25'] = newRow['AGE_BETWEEN_18_TO_25'];
      if (newRow['AGE_BETWEEN_25_TO_40']) newRow['Age 25-40'] = newRow['AGE_BETWEEN_25_TO_40'];
      if (newRow['AGE_BETWEEN_40_TO_60']) newRow['Age 40-60'] = newRow['AGE_BETWEEN_40_TO_60'];

      // Fallbacks for older formats
      if (!newRow['Location Name'] && newRow['Location']) newRow['Location Name'] = newRow['Location'];
      if (!newRow['PIN code'] && newRow['PIN Code']) newRow['PIN code'] = newRow['PIN Code'];
      if (!newRow['Coverage Status'] && newRow['Coverage (%)']) newRow['Coverage Status'] = newRow['Coverage (%)'];
      
      return newRow;
    });

    self.postMessage({ success: true, data: normalizedData });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
