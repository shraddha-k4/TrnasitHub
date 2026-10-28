
#include <stdio.h>
#include <stdlib.h>
#include <sys/stat.h>

/*
   TransitHub C Route Planner
   Uses Windows curl.exe to fetch backend JSON.
   PowerShell parses JSON because cJSON is not installed.
*/

#define API_URL "http://localhost:5000/api/route-planner/all-for-c"

int main(void)
{
    struct stat fileInfo;

    printf("\n====================================\n");
    printf("     TRANSITHUB C ROUTE PLANNER\n");
    printf("====================================\n");

    printf("\nConnecting to TransitHub backend...\n");

    /*
       Download API response into routes.json.
       No libcurl development headers are required.
    */
    if (system("curl.exe --fail --silent --show-error "
               "\"" API_URL "\" -o routes.json") != 0)
    {
        printf("\nERROR: Could not fetch backend data.\n");
        printf("Check these things:\n");
        printf("1. Node.js backend is running.\n");
        printf("2. API URL is correct.\n");
        printf("3. Endpoint returns HTTP 200.\n");
        return 1;
    }

    /* Check whether the JSON file exists and is not empty. */
    if (stat("routes.json", &fileInfo) != 0 ||
        fileInfo.st_size == 0)
    {
        printf("\nERROR: routes.json is missing or empty.\n");
        return 1;
    }

    printf("\nBackend response downloaded successfully!\n");
    printf("Response file: routes.json\n");
    printf("File size: %ld bytes\n", (long)fileInfo.st_size);

    /*
       Use PowerShell's built-in ConvertFrom-Json
       to search and sort the downloaded API data.
    */
    printf("\nStarting route search and sorting...\n\n");

    if (system("powershell.exe -NoProfile "
               "-ExecutionPolicy Bypass "
               "-File route_search.ps1") != 0)
    {
        printf("\nERROR: Route search failed.\n");
        printf("Check that route_search.ps1 exists in this folder.\n");
        return 1;
    }

    return 0;
}
