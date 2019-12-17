// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {observable, runInAction} from 'mobx'
import {observer} from 'mobx-react'

import {AppInsights} from "applicationinsights-js"
import 'script-loader!vss-web-extension-sdk/lib/VSS.SDK.min.js'
import * as JSZip from 'jszip'
import {Log, Viewer} from 'sarif-web-component'
declare var VSS: any

const isProduction = self !== top
const perfLoadStart = performance.now() // For telemetry.

@observer class Tab extends React.Component {
	@observable.ref logs = undefined as Log[]
	@observable pipelineId = undefined as string
	@observable user = undefined as string
	constructor(props) {
		super(props)
		VSS.init({
			applyTheme: true,
			explicitNotifyLoaded: true,
		})
		VSS.require(['TFS/Build/RestClient'], buildModule => {
			const wc = VSS.getWebContext()
			if (isProduction) {
				AppInsights.setAuthenticatedUserContext(wc.user.uniqueName /* typically email */, wc.account.name)
			}

			const client = buildModule.getClient()
			const onBuildChanged = build => {
				;(async () => { // Wrapper IIFE to allow rejection to be caught by our own telemetry.
					// Otherwise consumed by: /WebPlatform/Web/extensions/vss-web/vss-platform/Trace.ts
					const artifacts = await client.getArtifacts(build.id, build.project.id)
					const files = await (async () => {
						if (!artifacts.some(a => a.name === 'CodeAnalysisLogs')) return []
						const arrayBuffer = await client.getArtifactContentZip(build.id, 'CodeAnalysisLogs', build.project.id)
						const zip = await JSZip.loadAsync(arrayBuffer)
						return Object.values<any>(zip.files)
							.filter(entry => !entry.dir && entry.name.endsWith('.sarif'))
							.map((entry, i) => {
								let cachedPromise = undefined as string
								return {
									key:   i,
									text:  entry.name.replace('CodeAnalysisLogs/', ''),
									sarif: () => cachedPromise = cachedPromise || entry.async('string') as string
								}
							})
					})()

					const logTexts = await Promise.all(files.map(async file => await file.sarif()))

					// Some logs are: Unexpected token ﻿ in JSON at position 0
					const logs = logTexts.map(log => {
						try {
							return JSON.parse(log) as Log
						} catch(e) {
							AppInsights.trackException(e, `log: ${log.slice(0, 100)}`)
							return undefined
						}
					}).filter(log => log)

					const toolNames = logs.map(log => {
						return log.runs
							.filter(run => run.tool.driver) // Guard against old versions.
							.map(run => run.tool.driver.name)
					})
					const toolNamesSet = new Set([].concat(...toolNames))

					// Show file names when the tool names are homogeneous.
					if (files.length > 1 && toolNamesSet.size === 1) {
						logs.forEach((log, i) => 
							log.runs.forEach(run => {
								run.properties = run.properties || {}
								run.properties['logFileName'] = files[i].text
							})
						)
					}

					runInAction(() => {
						this.logs = logs
						this.pipelineId = `${VSS.getWebContext().account.name}.${build.definition.id}`
						this.user = wc.user.name
					})
					
					VSS.notifyLoadSucceeded()

					if (isProduction) {
						const customDimensions = {
							logLength: logs.length + '',
							toolNames: [...toolNamesSet.values()].join(' '),
							version: VSS.getExtensionContext().version,
						}
						AppInsights.trackPageView(wc.project.name, document.referrer, customDimensions, undefined, performance.now() - perfLoadStart)
					}
				})()
			}
			VSS.getConfiguration().onBuildChanged(onBuildChanged) // ;onBuildChanged({ id: 334, project: { id: '185a21d5-2948-4dca-9f43-a9248d571bd3' } })
		})
	}
	render() {
		const {logs, pipelineId, user} = this
		const filterState = {
			Baseline: { value: ['new', 'updated', 'absent'] },
			Level: { value: ['error', 'warning'] },
		}
		return !logs || logs.length
			? <Viewer logs={logs} pipelineId={pipelineId} filterState={filterState} user={user} />
			: <div className="full">No SARIF artifacts found.</div>
	}
}

if (isProduction) {
	AppInsights.downloadAndSetup({ instrumentationKey: 'b5fae72b-955d-40ef-a25b-7f2527ae710e' })
	addEventListener('unhandledrejection', e => AppInsights.trackException(e.reason))
}
ReactDOM.render(<Tab />, document.getElementById("app"))
