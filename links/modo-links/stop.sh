#!/bin/bash
jps -ml | grep modo-links-gateway-boot | grep -v grep | awk '{print $1}' | xargs kill -9
