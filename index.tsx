// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import 'script-loader!vss-web-extension-sdk/lib/VSS.SDK.min.js'
import * as JSZip from 'jszip'
const {Viewer} = require('sarif-web-component/components/Viewer.tsx')
declare var VSS: any

class Tab extends React.Component<any, any> {
	state = { log: undefined, files: undefined, fileIndex: 0 }
	constructor(props) {
		super(props)
		VSS.init({
			applyTheme: true,
			explicitNotifyLoaded: true,
		})
		VSS.require(['TFS/Build/RestClient'], restClient => {
			const client = restClient.getClient()
			const onBuildChanged = async build => {
				const artifacts = await client.getArtifacts(build.id, build.project.id)
				const files = await (async () => {
					if (!artifacts.some(a => a.name === 'CodeAnalysisLogs')) return []
					const arrayBuffer = await client.getArtifactContentZip(build.id, 'CodeAnalysisLogs', build.project.id)					
					const zip = await JSZip.loadAsync(arrayBuffer)
					return Object.values<any>(zip.files)
						.filter(entry => !entry.dir && entry.name.endsWith('.sarif'))
						.map((entry, i) => {
							let cachedPromise = undefined
							return {
								key:   i,
								text:  entry.name.replace('CodeAnalysisLogs/', ''),
								sarif: () => cachedPromise = cachedPromise || entry.async('string')
							}
						})
				})()
				const first = files && files[0]
				this.setState({ log: first && JSON.parse(await first.sarif()) })
				VSS.notifyLoadSucceeded()
			}
			VSS.getConfiguration().onBuildChanged(onBuildChanged) // ;onBuildChanged({ id: 334, project: { id: '185a21d5-2948-4dca-9f43-a9248d571bd3' } })
		})
	}
	render() {
		const {files, log} = this.state
		return !files || files.length
			? <Viewer runs={log && log.runs} />
			: <div className="full">No SARIF artifacts found.</div>
	}
}

ReactDOM.render(<Tab />, document.getElementById("app"))
