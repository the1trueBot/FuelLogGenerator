const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const maxTankCapacityInput = document.getElementById('maxTankCapacity');
        const totalGallonsToPurchaseInput = document.getElementById('totalGallonsToPurchase');
        const gasStationsInput = document.getElementById('gasStationsInput');
        const generateLogBtn = document.getElementById('generateLogBtn');
        const resetBtn = document.getElementById('resetBtn'); // New reset button
        const errorMessageDiv = document.getElementById('errorMessage');
        const errorMessageText = document.getElementById('errorMessageText');
        const tableContainer = document.getElementById('tableContainer');
        const purchaseLogTableBody = document.getElementById('purchaseLogTableBody');
        const totalGallonsInLogSpan = document.getElementById('totalGallonsInLog');

        // Helper for random sampling without replacement
        function randomSample(array, size) {
            const shuffled = [...array].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, size);
        }

        // Simple random number generator (Python's random.uniform equivalent)
        const random = {
            uniform: (min, max) => Math.random() * (max - min) + min,
            choice: (array) => array[Math.floor(Math.random() * array.length)]
        };

        // Function to display error messages
        function showError(message) {
            errorMessageText.textContent = message;
            errorMessageDiv.classList.remove('d-none'); // Use Bootstrap's d-none
            tableContainer.classList.add('d-none'); // Hide table if there's an error
        }

        // Function to hide error messages
        function hideError() {
            errorMessageDiv.classList.add('d-none');
            errorMessageText.textContent = '';
        }

        // Function to generate the fuel log
        function generateLog() {
            hideError(); // Clear previous errors

            const startDateStr = startDateInput.value;
            const endDateStr = endDateInput.value;
            const maxTankCapacity = parseFloat(maxTankCapacityInput.value);
            const totalGallonsToPurchase = parseFloat(totalGallonsToPurchaseInput.value);
            const gasStations = gasStationsInput.value.split('\n')
                                .map(s => s.trim())
                                .filter(s => s.length > 0);

            const parsedStartDate = new Date(startDateStr);
            const parsedEndDate = new Date(endDateStr);

            // --- Input Validation ---
            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                showError('Please enter valid start and end dates.');
                return;
            }
            if (parsedStartDate >= parsedEndDate) {
                showError('End Date must be after Start Date.');
                return;
            }
            if (isNaN(maxTankCapacity) || maxTankCapacity <= 0) {
                showError('Max Tank Capacity must be a positive number.');
                return;
            }
            if (isNaN(totalGallonsToPurchase) || totalGallonsToPurchase <= 0) {
                showError('Total Gallons to Purchase must be a positive number.');
                return;
            }
            if (gasStations.length === 0) {
                showError('Please enter at least one gas station.');
                return;
            }
            if (totalGallonsToPurchase < maxTankCapacity) {
                showError('Total gallons to purchase should generally be greater than or equal to max tank capacity.');
                return;
            }

            // --- Log Generation Logic ---
            const log = [];
            const minFillAmount = 5; // Minimum realistic fill amount

            // Calculate the number of days in the range
            const diffTime = Math.abs(parsedEndDate.getTime() - parsedStartDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Estimate a reasonable number of purchases to distribute the total gallons
            const estimatedAvgFill = (minFillAmount + maxTankCapacity) / 2;
            let numPurchases = Math.ceil(totalGallonsToPurchase / estimatedAvgFill);

            // Ensure we don't try to make more purchases than there are days, or too few
            numPurchases = Math.max(Math.min(numPurchases, diffDays), Math.ceil(totalGallonsToPurchase / maxTankCapacity));
            numPurchases = Math.max(numPurchases, 1); // Ensure at least one purchase if totalGallonsToPurchase > 0

            // Generate spaced-out random dates
            let selectedDates = [];
            let currentDate = new Date(parsedStartDate);
            for (let i = 0; i < numPurchases && currentDate <= parsedEndDate; i++) {
                selectedDates.push(new Date(currentDate));

                // Randomly skip 2 to 5 days ahead
                const daysToAdd = Math.floor(random.uniform(2, 6)); // 2 to 5 inclusive
                currentDate.setDate(currentDate.getDate() + daysToAdd);
            }


            // Generate random fill amounts
            let generatedGallons = Array(numPurchases).fill(0).map(() =>
                random.uniform(minFillAmount, maxTankCapacity)
            );

            const currentSum = generatedGallons.reduce((sum, val) => sum + val, 0);
            const scaleFactor = totalGallonsToPurchase / currentSum;

            generatedGallons = generatedGallons.map(g => {
                let scaledG = g * scaleFactor;
                return Math.max(minFillAmount, Math.min(maxTankCapacity, scaledG));
            });

            let finalSum = generatedGallons.reduce((sum, val) => sum + val, 0);
            let diff = totalGallonsToPurchase - finalSum;
            let iterationCount = 0;
            const maxIterations = 150; // Prevent infinite loop for tiny differences

            while (Math.abs(diff) > 0.1 && iterationCount < maxIterations) { // Adjust if difference is > 0.1 gallons
                const adjustmentPerItem = diff / numPurchases;
                generatedGallons = generatedGallons.map(g => {
                    let adjustedG = g + adjustmentPerItem;
                    return Math.max(minFillAmount, Math.min(maxTankCapacity, adjustedG));
                });
                finalSum = generatedGallons.reduce((sum, val) => sum + val, 0);
                diff = totalGallonsToPurchase - finalSum;
                iterationCount++;
            }

            // Populate the log
            let runningTotalForDisplay = 0;
            purchaseLogTableBody.innerHTML = ''; // Clear previous table rows

            for (let i = 0; i < numPurchases; i++) {
                const purchaseDate = selectedDates[i];
                const gallons = parseFloat(generatedGallons[i].toFixed(1)); // Round to 1 decimal place
                const station = random.choice(gasStations);

                // Add to log array (optional, but good for internal state if needed later)
                log.push({
                    date: purchaseDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                    gallons: gallons,
                    station: station
                });

                // Dynamically create table row
                const row = purchaseLogTableBody.insertRow();
                const dateCell = row.insertCell();
                const gallonsCell = row.insertCell();
                const stationCell = row.insertCell();

                dateCell.textContent = purchaseDate.toISOString().split('T')[0];
                gallonsCell.textContent = gallons.toFixed(1);
                stationCell.textContent = station;

                runningTotalForDisplay += gallons;
            }

            // Update total gallons display
            totalGallonsInLogSpan.textContent = runningTotalForDisplay.toFixed(1) + ' gallons';
            tableContainer.classList.remove('d-none'); // Show the table
        }

        // Function to reset inputs and hide table
        function resetForm() {
            startDateInput.value = "2024-07-01";
            endDateInput.value = "2025-06-30";
            maxTankCapacityInput.value = "26";
            totalGallonsToPurchaseInput.value = "2450";
            gasStationsInput.value = `Circle K, 35 S Grand Blvd, St Louis, Missouri, 63103
BP, 1815 Arsenal, St Louis, Missouri, 63118
Moto, 3120 Mississippi Ave, Sauget, Illinois, 6220
Love's, 6124 N Broadway, St Louis, Missouri, 63147
Circle K, 1514 Hampton Ave, St Louis, Missouri, 63139
Zoom, 1300 N Tucker Blvd, St. Louis, Missouri, 63106
ZX, 1007 S Broadway, St Louis, Missouri, 63103
Shell, 721 N Tucker Blvd, St Louis, Missouri, 63101
QuikTrip, 2600 Chouteau Ave, St Louis, Missouri, 63103
Phillips 66, 1655 S Jefferson Ave, St Louis, Missouri, 63104`;
            purchaseLogTableBody.innerHTML = ''; // Clear table rows
            tableContainer.classList.add('d-none'); // Hide table
            hideError(); // Hide any error messages
        }


        // Event listeners
        generateLogBtn.addEventListener('click', generateLog);
        resetBtn.addEventListener('click', resetForm); // Add event listener for reset button

        // Initial generation on page load
        document.addEventListener('DOMContentLoaded', generateLog);