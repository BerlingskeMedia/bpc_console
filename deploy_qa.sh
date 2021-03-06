#!/bin/bash

################################################################################
# Help                                                                         #
################################################################################
Help()
{
   # Display Help
   echo "HELP:"
   echo
   echo "Purpose of this script is to make tag & deploy more convenient. It is designed to work with Berlingske's drone.io CI/CD."
   echo
   echo "Syntax: $0 [-h|--help] | [testing|qa1|qa2|...] [[commentary to this tag]]"
   echo
   echo "required argument:"
   echo "-h|--help       Displays this help page, will ignore all other arguments"
   echo "testing|qa[n]   Environment name, the >n< index of QA for which this branch should be tagged."
   echo "commentary      If not provided, will be generated automatically."
   echo
   echo "tag syntax:"
   echo "[environment_name]-[version]-[branch_name]"
   echo "environment_name Name of the environment eg: testing, qa1"
   echo "version        Incrementally new version of tag on this specific environment (if any yet created - will be set to version 1)"
   echo "branch_name    Current branch's name"
   echo
}

################################################################################
################################################################################
# Main program                                                                 #
################################################################################
########


allowed_envs=( "testing" "qa1" "qa2")

if [[ $1 = "-h" || $1 = "--help" ]]; then
	Help
	exit 0
fi

if [[ ! " ${allowed_envs[@]} " =~ " ${1} " ]]; then
	echo -e "\e[31mIllegal env name!\e[39m Chose one from provided:\e[34m\e[1m\n\t${allowed_envs[@]}\e[0m"
	Help
	exit 1
fi

QA=$1
shift
COMMENT="$@"

if [ -z "$COMMENT" ]; then
	COMMENT="$QA from branch: $BRANCH_NAME"
fi

LAST_TAG=$(git tag | grep -P "^$QA-\d+-" |sort -k2 -t- -n | tail -n 1)
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

# Check if tag exists, if not create first tag
if [ -z "$LAST_TAG" ]; then
	TAG=$QA-1-$BRANCH_NAME
	echo -e "This is \e[34m\e[1mfirst\e[0m tag and will be named: \e[34m\e[1m$TAG\e[0m"
else
	TAG_LAST_NUM=$(echo "$LAST_TAG" | cut -d "-" -f2)
	TAG_NUM=$((TAG_LAST_NUM+1))
	TAG=$QA-$TAG_NUM-$BRANCH_NAME
	echo -e "Last tag was: \e[34m\e[1m$LAST_TAG\e[0m new tag wil be named: \e[34m\e[1m$TAG\e[0m"
fi

read -p "Do you want to proceed? [y/n] :" -r
echo
if [[ ! $REPLY =~ ^[Yy](es)?$ ]]; then
	echo "Aborting!"
	exit 0
fi

echo "Tagging..."
git tag -a "$TAG" -m "$COMMENT"
git push origin "$TAG"

echo -e "\e[32mDone!\e[0m"
