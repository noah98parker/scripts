# PowerShell script for installing and configuring CrushFTP on Windows Server
# This script will:
# 1. Install Java Runtime Environment (JRE)
# 2. Download and install CrushFTP
# 3. Create the shared folder with proper permissions
# 4. Configure CrushFTP users (John and Bob)
# 5. Create a test.txt file for testing

# Set execution policy
Set-ExecutionPolicy Bypass -Scope Process -Force

# Create installation directories
$CrushFTPInstallDir = "C:\CrushFTP"
$SharedDir = "C:\CrushFTPShared"
$TempDir = "C:\Temp"

# Create directories if they don't exist
if (-not (Test-Path $CrushFTPInstallDir)) {
    New-Item -ItemType Directory -Path $CrushFTPInstallDir
}
if (-not (Test-Path $SharedDir)) {
    New-Item -ItemType Directory -Path $SharedDir
}
if (-not (Test-Path $TempDir)) {
    New-Item -ItemType Directory -Path $TempDir
}

# Step 1: Install Java Runtime Environment (JRE) or JDK
Write-Host "Downloading and installing Java..."
$JavaURL = "https://download.oracle.com/java/20/latest/jdk-20_windows-x64_bin.exe"
$JavaInstaller = "$TempDir\jdk_installer.exe"

# Download Java installer
Invoke-WebRequest -Uri $JavaURL -OutFile $JavaInstaller

# Install Java silently
Start-Process -FilePath $JavaInstaller -ArgumentList "/s" -Wait

# Step 2: Download and install CrushFTP
Write-Host "Downloading and installing CrushFTP..."
$CrushFTPURL = "https://www.crushftp.com/early9/J/CrushFTP9.zip"
$CrushFTPZip = "$TempDir\CrushFTP9.zip"

# Download CrushFTP
Invoke-WebRequest -Uri $CrushFTPURL -OutFile $CrushFTPZip

# Extract CrushFTP to installation directory
Expand-Archive -Path $CrushFTPZip -DestinationPath $CrushFTPInstallDir -Force

# Step 3: Create shared folder structure and test file
Write-Host "Setting up shared folder and test file..."
$TestFile = "$SharedDir\test.txt"
Set-Content -Path $TestFile -Value "This is a test file for CrushFTP."

# Step 4: Set permissions on shared folder
# Create local groups for permissions
New-LocalGroup -Name "CrushFTP_ReadWrite" -Description "CrushFTP Read-Write Access"
New-LocalGroup -Name "CrushFTP_ReadOnly" -Description "CrushFTP Read-Only Access"

# Create local users for John and Bob
$JohnPassword = ConvertTo-SecureString "JohnPassword123!" -AsPlainText -Force
$BobPassword = ConvertTo-SecureString "BobPassword123!" -AsPlainText -Force

New-LocalUser -Name "John" -Password $JohnPassword -FullName "John Admin" -Description "CrushFTP Administrator"
New-LocalUser -Name "Bob" -Password $BobPassword -FullName "Bob Partner" -Description "External Partner"

# Add users to appropriate groups
Add-LocalGroupMember -Group "CrushFTP_ReadWrite" -Member "John"
Add-LocalGroupMember -Group "CrushFTP_ReadOnly" -Member "Bob"

# Set folder permissions
$Acl = Get-Acl $SharedDir
$Acl.SetAccessRuleProtection($true, $false) # Disable inheritance, remove inherited permissions

# Add Full Control for Administrators
$AdminAccessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$Acl.AddAccessRule($AdminAccessRule)

# Add Read/Write permissions for John's group
$ReadWriteAccessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("CrushFTP_ReadWrite", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$Acl.AddAccessRule($ReadWriteAccessRule)

# Add Read-only permissions for Bob's group
$ReadOnlyAccessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("CrushFTP_ReadOnly", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$Acl.AddAccessRule($ReadOnlyAccessRule)

# Apply the ACL to the directory
Set-Acl -Path $SharedDir -AclObject $Acl

# Step 5: Create CrushFTP configuration files
# Since CrushFTP uses XML files for configuration, we'll create them manually
$CrushFTPUsersDir = "$CrushFTPInstallDir\users"
if (-not (Test-Path $CrushFTPUsersDir)) {
    New-Item -ItemType Directory -Path $CrushFTPUsersDir
}

# Create admin user (John) XML file
$JohnUserXML = @"
<?xml version="1.0" encoding="UTF-8"?>
<user>
  <username>John</username>
  <password_hash>JohnPassword123!</password_hash>
  <admin>true</admin>
  <root_dir>$SharedDir</root_dir>
  <permissions>
    <read>true</read>
    <write>true</write>
    <delete>true</delete>
    <rename>true</rename>
    <makedir>true</makedir>
  </permissions>
</user>
"@

# Create external partner user (Bob) XML file
$BobUserXML = @"
<?xml version="1.0" encoding="UTF-8"?>
<user>
  <username>Bob</username>
  <password_hash>BobPassword123!</password_hash>
  <admin>false</admin>
  <root_dir>$SharedDir</root_dir>
  <permissions>
    <read>true</read>
    <write>false</write>
    <delete>false</delete>
    <rename>false</rename>
    <makedir>false</makedir>
  </permissions>
</user>
"@

# Save XML files
Set-Content -Path "$CrushFTPUsersDir\John.xml" -Value $JohnUserXML
Set-Content -Path "$CrushFTPUsersDir\Bob.xml" -Value $BobUserXML

# Step 6: Create CrushFTP startup script
$StartupScript = @"
@echo off
cd $CrushFTPInstallDir
start javaw -jar CrushFTP.jar -a
"@

Set-Content -Path "$CrushFTPInstallDir\StartCrushFTP.bat" -Value $StartupScript

# Step 7: Configure CrushFTP as a Windows service
$ServiceScript = @"
@echo off
cd $CrushFTPInstallDir
java -jar CrushFTP.jar -install
"@

Set-Content -Path "$CrushFTPInstallDir\InstallService.bat" -Value $ServiceScript

# Run the service installation script
Set-Location -Path $CrushFTPInstallDir
& "$CrushFTPInstallDir\InstallService.bat"

# Step 8: Ensure the service is started
Start-Service -Name "CrushFTP"

# Step 9: Open firewall ports for the specified IPs
# Allow RDP for John (71.126.187.142)
New-NetFirewallRule -DisplayName "RDP-John" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3389 -RemoteAddress 71.126.187.142

# Allow SSH/SFTP for John (71.126.187.142)
New-NetFirewallRule -DisplayName "SSH-John" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 22 -RemoteAddress 71.126.187.142

# Allow SSH/SFTP for Bob (20.102.88.207)
New-NetFirewallRule -DisplayName "SSH-Bob" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 22 -RemoteAddress 20.102.88.207

Write-Host "CrushFTP installation and configuration completed successfully!"
