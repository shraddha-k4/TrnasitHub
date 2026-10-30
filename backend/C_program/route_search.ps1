param(
    [string]$From = "",
    [string]$To = "",
    [string]$DepartureTime = "",
    [string]$Keyword = "",
    [switch]$JsonOutput
)

$ErrorActionPreference = "Stop"

function Convert-ToTimeOfDay {
    param([AllowNull()][string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text) -or $Text.Trim() -eq "-") {
        return $null
    }

    $t = $Text.Trim()
    $t = $t -replace '\.(?=\d)', ':'
    $t = $t -replace '(?i)a\.?\s*m\.?', 'AM'
    $t = $t -replace '(?i)p\.?\s*m\.?', 'PM'
    $t = $t -replace '(?i)(\d)(AM|PM)', '$1 $2'
    $t = ($t -replace '\s+', ' ').Trim()

    $formats = [string[]]@(
        "h:mm tt", "hh:mm tt",
        "h:mm:ss tt", "hh:mm:ss tt",
        "h tt", "hh tt",
        "H:mm", "HH:mm",
        "H:mm:ss", "HH:mm:ss"
    )

    $parsed = [DateTime]::MinValue

    if ([DateTime]::TryParseExact(
        $t,
        $formats,
        [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::None,
        [ref]$parsed
    )) {
        return $parsed.TimeOfDay
    }

    return $null
}

function Get-Field {
    param(
        [object]$Object,
        [string[]]$Names,
        [object]$Default = ""
    )

    if ($null -eq $Object) {
        return $Default
    }

    foreach ($name in $Names) {
        $property = $Object.PSObject.Properties[$name]

        if ($null -ne $property -and $null -ne $property.Value) {
            return $property.Value
        }
    }

    return $Default
}

function Convert-StopName {
    param([object]$Stop)

    if ($null -eq $Stop) {
        return ""
    }

    if ($Stop -is [string]) {
        return $Stop.Trim()
    }

    return ([string](Get-Field $Stop @(
        "stop_name", "name", "stop", "location", "station_name"
    ) "")).Trim()
}

function Find-StopIndex {
    param(
        [string[]]$Stops,
        [string]$Location
    )

    for ($i = 0; $i -lt $Stops.Count; $i++) {
        if (
            -not [string]::IsNullOrWhiteSpace($Stops[$i]) -and
            $Stops[$i].IndexOf(
                $Location,
                [StringComparison]::OrdinalIgnoreCase
            ) -ge 0
        ) {
            return $i
        }
    }

    return -1
}

try {
    # Read routes.json from the same folder as this script.
    $jsonPath = Join-Path $PSScriptRoot "routes.json"

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        throw "routes.json not found: $jsonPath"
    }

    $response = Get-Content -LiteralPath $jsonPath -Raw |
        ConvertFrom-Json

    if ($response.success -ne $true) {
        throw "Backend returned success=false."
    }

    if ($null -eq $response.data) {
        throw "Backend response does not contain data."
    }

    $routes = @($response.data)

    # Convert optional '-' arguments to empty values.
    if ($From -eq "-") { $From = "" }
    if ($To -eq "-") { $To = "" }
    if ($DepartureTime -eq "-") { $DepartureTime = "" }
    if ($Keyword -eq "-") { $Keyword = "" }

    if (-not $JsonOutput) {
        Write-Host ""
        Write-Host "===================================="
        Write-Host "       TRANSITHUB ROUTE PLANNER"
        Write-Host "===================================="
        Write-Host "Routes received from API: $($routes.Count)"
        Write-Host ""

        if ([string]::IsNullOrWhiteSpace($From)) {
            $From = Read-Host "Enter starting location"
        }

        if ([string]::IsNullOrWhiteSpace($To)) {
            $To = Read-Host "Enter destination"
        }

        if ([string]::IsNullOrWhiteSpace($DepartureTime)) {
            $DepartureTime = Read-Host "Enter departure time (optional)"
        }

        if ([string]::IsNullOrWhiteSpace($Keyword)) {
            $Keyword = Read-Host "Enter keyword (optional)"
        }
    }

    $from = $From.Trim()
    $to = $To.Trim()
    $depInput = $DepartureTime.Trim()
    $keyword = $Keyword.Trim()

    if ([string]::IsNullOrWhiteSpace($from)) {
        throw "Starting location cannot be empty."
    }

    if ([string]::IsNullOrWhiteSpace($to)) {
        throw "Destination cannot be empty."
    }

    $minTime = $null

    if (-not [string]::IsNullOrWhiteSpace($depInput)) {
        $minTime = Convert-ToTimeOfDay $depInput

        if ($null -eq $minTime) {
            throw "Invalid time. Use 3:30 PM or 15:30."
        }
    }

    # Search routes.
    $results = @(
        foreach ($route in $routes) {
            $routeFrom = [string](Get-Field $route @(
                "from", "source", "start", "origin"
            ) "")

            $routeTo = [string](Get-Field $route @(
                "to", "destination", "end"
            ) "")

            $rawStops = @(Get-Field $route @(
                "stops", "route_stops", "stations"
            ) @())

            $stopNames = @(
                foreach ($stop in $rawStops) {
                    $name = Convert-StopName $stop
                    if (-not [string]::IsNullOrWhiteSpace($name)) {
                        $name
                    }
                }
            )

            # Ensure route endpoints are included in the stop list.
            if (
                -not [string]::IsNullOrWhiteSpace($routeFrom) -and
                ($stopNames.Count -eq 0 -or
                 $stopNames[0] -notlike "*$routeFrom*")
            ) {
                $stopNames = @($routeFrom) + $stopNames
            }

            if (
                -not [string]::IsNullOrWhiteSpace($routeTo) -and
                ($stopNames.Count -eq 0 -or
                 $stopNames[-1] -notlike "*$routeTo*")
            ) {
                $stopNames += $routeTo
            }

            $startIndex = Find-StopIndex -Stops $stopNames -Location $from
            $endIndex = Find-StopIndex -Stops $stopNames -Location $to

            if (
                $startIndex -lt 0 -or
                $endIndex -lt 0 -or
                $startIndex -ge $endIndex
            ) {
                continue
            }

            $departure = [string](Get-Field $route @(
                "departure_time", "departureTime", "departure",
                "start_time", "depart_time"
            ) "")

            if ($null -ne $minTime) {
                $routeTime = Convert-ToTimeOfDay $departure

                if ($null -eq $routeTime -or $routeTime -lt $minTime) {
                    continue
                }
            }

            $mode = [string](Get-Field $route @(
                "mode", "transport_type", "transport", "type", "category"
            ) "unknown")

            $routeNumber = [string](Get-Field $route @(
                "route_number", "service_no", "train_number", "number"
            ) "")

            $routeName = [string](Get-Field $route @(
                "route_name", "name", "title"
            ) "")

            $operator = [string](Get-Field $route @(
                "operator", "agency"
            ) "")

            $arrival = [string](Get-Field $route @(
                "arrival_time", "arrivalTime", "arrival", "end_time"
            ) "")

            $duration = [string](Get-Field $route @(
                "duration", "estimated_duration", "travel_time"
            ) "")

            if (-not [string]::IsNullOrWhiteSpace($keyword)) {
                $allText = @(
                    $mode, $routeNumber, $routeName,
                    $routeFrom, $routeTo, $operator,
                    $departure, $arrival, $duration
                ) + $stopNames

                $searchText = ($allText -join " ")

                if ($searchText.IndexOf(
                    $keyword,
                    [StringComparison]::OrdinalIgnoreCase
                ) -lt 0) {
                    continue
                }
            }

            [PSCustomObject]@{
                mode           = $mode
                route_number   = $routeNumber
                route_name     = $routeName
                from           = $routeFrom
                to             = $routeTo
                departure_time = $departure
                arrival_time   = $arrival
                duration       = $duration
                operator       = $operator
                stops          = @($stopNames)
            }
        }
    )

    # Sort by departure time.
    $sorted = @(
        $results | Sort-Object -Property @(
            @{
                Expression = {
                    $time = Convert-ToTimeOfDay $_.departure_time
                    if ($null -eq $time) {
                        [TimeSpan]::MaxValue
                    } else {
                        $time
                    }
                }
            },
            @{ Expression = { $_.route_number } }
        )
    )

    # JSON output for Express / React.
    if ($JsonOutput) {
        $jsonResult = [PSCustomObject]@{
            success = $true
            from    = $from
            to      = $to
            count   = $sorted.Count
            data    = @($sorted)
        }

        ConvertTo-Json -InputObject $jsonResult -Depth 8 -Compress
        exit 0
    }

    # Terminal output.
    Write-Host ""
    Write-Host "===================================="
    Write-Host "          SEARCH RESULTS"
    Write-Host "===================================="
    Write-Host "From: $from"
    Write-Host "To: $to"
    Write-Host "Matching routes: $($sorted.Count)"
    Write-Host ""

    if ($sorted.Count -eq 0) {
        Write-Host "No matching routes found."
    }
    else {
        $sorted |
            Select-Object mode, route_number, route_name,
                from, to, departure_time, arrival_time, duration,
                @{Name="Stops"; Expression={ $_.stops -join " -> " }} |
            Format-Table -AutoSize -Wrap
    }

    Write-Host ""
    Write-Host "Route search completed."
}
catch {
    if ($JsonOutput) {
        [PSCustomObject]@{
            success = $false
            message = $_.Exception.Message
            count   = 0
            data    = @()
        } | ConvertTo-Json -Depth 8 -Compress
    }
    else {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    exit 1
}
