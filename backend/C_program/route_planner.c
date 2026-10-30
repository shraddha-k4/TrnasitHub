#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <windows.h>

#define API_URL "http://localhost:5000/api/route-planner/all-for-c"

#define MAX_INPUT 256
#define MAX_COMMAND 4096

int valid_input(const char *s)
{
    if (s == NULL || strlen(s) >= MAX_INPUT)
        return 0;

    for (size_t i = 0; s[i] != '\0'; i++)
    {
        unsigned char c = (unsigned char)s[i];

        if (!(isalnum(c) || c == ' ' || c == '-' ||
              c == '_' || c == '.' || c == ':' ||
              c == '/'))
        {
            return 0;
        }
    }

    return 1;
}

int main(int argc, char *argv[])
{
    char from[MAX_INPUT] = "";
    char to[MAX_INPUT] = "";
    char departureTime[MAX_INPUT] = "";
    char keyword[MAX_INPUT] = "";

    char exePath[MAX_PATH];
    char folderPath[MAX_PATH];
    char scriptPath[MAX_PATH];
    char jsonPath[MAX_PATH];

    char command[MAX_COMMAND];

    int apiMode = (argc == 5);

    if (argc != 1 && argc != 5)
    {
        fprintf(stderr,
            "Usage: route_planner.exe \"From\" \"To\" "
            "\"DepartureTime\" \"Keyword\"\n");
        return 1;
    }

    /* Get the folder where route_planner.exe is located. */
    DWORD pathLength = GetModuleFileNameA(
        NULL, exePath, MAX_PATH
    );

    if (pathLength == 0 || pathLength >= MAX_PATH)
    {
        fprintf(stderr, "ERROR: Cannot find executable folder.\n");
        return 1;
    }

    char *lastSlash = strrchr(exePath, '\\');

    if (lastSlash == NULL)
    {
        fprintf(stderr, "ERROR: Invalid executable path.\n");
        return 1;
    }

    *lastSlash = '\0';

    snprintf(folderPath, sizeof(folderPath), "%s", exePath);
    snprintf(scriptPath, sizeof(scriptPath),
             "%s\\route_search.ps1", folderPath);
    snprintf(jsonPath, sizeof(jsonPath),
             "%s\\routes.json", folderPath);

    if (apiMode)
    {
        snprintf(from, sizeof(from), "%s", argv[1]);
        snprintf(to, sizeof(to), "%s", argv[2]);
        snprintf(departureTime, sizeof(departureTime), "%s", argv[3]);
        snprintf(keyword, sizeof(keyword), "%s", argv[4]);

        if (!valid_input(from) || !valid_input(to) ||
            !valid_input(departureTime) || !valid_input(keyword))
        {
            fprintf(stderr, "ERROR: Invalid search input.\n");
            return 1;
        }

        if (strlen(from) == 0 || strlen(to) == 0)
        {
            fprintf(stderr, "ERROR: From and To are required.\n");
            return 1;
        }

        /* Use '-' for optional empty values. */
        if (strlen(departureTime) == 0)
            snprintf(departureTime, sizeof(departureTime), "-");

        if (strlen(keyword) == 0)
            snprintf(keyword, sizeof(keyword), "-");
    }
    else
    {
        printf("\n====================================\n");
        printf("     TRANSITHUB C ROUTE PLANNER\n");
        printf("====================================\n");
    }

    /* Check that the PowerShell script exists. */
    if (GetFileAttributesA(scriptPath) == INVALID_FILE_ATTRIBUTES)
    {
        fprintf(stderr, "ERROR: route_search.ps1 not found.\n");
        return 1;
    }

    /* Download all routes from the Express backend. */
    printf("\nFetching routes from TransitHub backend...\n");

    int n = snprintf(
        command,
        sizeof(command),
        "curl.exe --fail --silent --show-error "
        "\"%s\" -o \"%s\"",
        API_URL,
        jsonPath
    );

    if (n < 0 || (size_t)n >= sizeof(command))
    {
        fprintf(stderr, "ERROR: Download command is too long.\n");
        return 1;
    }

    if (system(command) != 0)
    {
        fprintf(stderr, "ERROR: Could not fetch backend routes.\n");
        return 1;
    }

    /* Verify downloaded JSON file. */
    WIN32_FILE_ATTRIBUTE_DATA fileInfo;

    if (!GetFileAttributesExA(
        jsonPath, GetFileExInfoStandard, &fileInfo
    ))
    {
        fprintf(stderr, "ERROR: routes.json was not created.\n");
        return 1;
    }

    if (fileInfo.nFileSizeHigh == 0 &&
        fileInfo.nFileSizeLow == 0)
    {
        fprintf(stderr, "ERROR: routes.json is empty.\n");
        return 1;
    }

    printf("Routes downloaded successfully.\n");

    /* Build PowerShell command. */
    if (apiMode)
    {
        n = snprintf(
            command,
            sizeof(command),
            "powershell.exe -NoLogo -NoProfile "
            "-ExecutionPolicy Bypass "
            "-File \"%s\" "
            "-From \"%s\" "
            "-To \"%s\" "
            "-DepartureTime \"%s\" "
            "-Keyword \"%s\" "
            "-JsonOutput",
            scriptPath,
            from,
            to,
            departureTime,
            keyword
        );
    }
    else
    {
        n = snprintf(
            command,
            sizeof(command),
            "powershell.exe -NoLogo -NoProfile "
            "-ExecutionPolicy Bypass "
            "-File \"%s\"",
            scriptPath
        );
    }

    if (n < 0 || (size_t)n >= sizeof(command))
    {
        fprintf(stderr, "ERROR: PowerShell command is too long.\n");
        return 1;
    }

    /* Run route search. */
    int result = system(command);

    if (result != 0)
    {
        fprintf(stderr, "ERROR: Route search failed.\n");
        return 1;
    }

    return 0;
}
