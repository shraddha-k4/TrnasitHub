#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <sys/stat.h>

#define API_URL "http://localhost:5000/api/route-planner/all-for-c"

#define MAX_INPUT 256
#define MAX_COMMAND 1600

/* Allow simple route/search values only.
   This prevents shell-special characters in arguments. */
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
    struct stat fileInfo;
    char from[MAX_INPUT] = "";
    char to[MAX_INPUT] = "";
    char departureTime[MAX_INPUT] = "";
    char keyword[MAX_INPUT] = "";
    char command[MAX_COMMAND];

    /* No arguments: interactive terminal mode.
       Four arguments: API/frontend mode. */
    int apiMode = (argc == 5);

    if (argc != 1 && argc != 5)
    {
        fprintf(stderr,
            "Usage: route_planner.exe \"From\" \"To\" "
            "\"DepartureTime\" \"Keyword\"\n");
        return 1;
    }

    if (apiMode)
    {
        snprintf(from, sizeof(from), "%s", argv[1]);
        snprintf(to, sizeof(to), "%s", argv[2]);
        snprintf(departureTime, sizeof(departureTime), "%s", argv[3]);
        snprintf(keyword, sizeof(keyword), "%s", argv[4]);
        /* PowerShell may omit an empty native argument.
        Treat "-" as an empty keyword. */
        if (strcmp(keyword, "-") == 0)
        {
            keyword[0] = '\0';
        }

        if (!valid_input(from) || !valid_input(to) ||
            !valid_input(departureTime) || !valid_input(keyword))
        {
            fprintf(stderr, "ERROR: Invalid search input.\n");
            return 1;
        }
    }
    else
    {
        printf("\n====================================\n");
        printf("     TRANSITHUB C ROUTE PLANNER\n");
        printf("====================================\n");
        printf("\nConnecting to TransitHub backend...\n");
    }

    /* Download routes from Express backend. */
    if (system("curl.exe --fail --silent --show-error "
               "\"" API_URL "\" -o routes.json") != 0)
    {
        fprintf(stderr, "ERROR: Could not fetch backend data.\n");
        return 1;
    }

    if (stat("routes.json", &fileInfo) != 0 ||
        fileInfo.st_size == 0)
    {
        fprintf(stderr, "ERROR: routes.json is missing or empty.\n");
        return 1;
    }

    if (!apiMode)
    {
        printf("\nBackend response downloaded successfully!\n");
        printf("Response file: routes.json\n");
        printf("File size: %ld bytes\n", (long)fileInfo.st_size);
        printf("\nStarting route search and sorting...\n\n");
    }

    if (apiMode)
    {
        /* Values are passed to the existing PowerShell parameters. */
        int n = snprintf(
            command, sizeof(command),
            "powershell.exe -NoLogo -NoProfile "
            "-ExecutionPolicy Bypass "
            "-File route_search.ps1 "
            "-From \"%s\" -To \"%s\" "
            "-DepartureTime \"%s\" -Keyword \"%s\" "
            "-JsonOutput",
            from, to, departureTime, keyword
        );

        if (n < 0 || (size_t)n >= sizeof(command))
        {
            fprintf(stderr, "ERROR: Search command is too long.\n");
            return 1;
        }
    }
    else
    {
        snprintf(
            command, sizeof(command),
            "powershell.exe -NoLogo -NoProfile "
            "-ExecutionPolicy Bypass "
            "-File route_search.ps1"
        );
    }

    int result = system(command);

    if (result != 0)
    {
        fprintf(stderr, "ERROR: Route search failed.\n");
        return 1;
    }

    return 0;
}
