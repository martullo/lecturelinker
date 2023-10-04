document.getElementById('download-button').addEventListener('click', function () {
    const checkboxes = document.querySelectorAll('input[name="selected_files"]:checked');
    const queryParameters = [];

    checkboxes.forEach((checkbox, index) => {
        queryParameters.push(`file${index}=${encodeURIComponent(checkbox.value)}`);
    });

    const queryString = queryParameters.join('&');
    console.log(queryString);
    const downloadLink = `/download?${queryString}`;
    window.location.href = downloadLink;
});