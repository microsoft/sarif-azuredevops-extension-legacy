import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {ResultsViewer, Dropdown} from 'sarif-web-component/Index.tsx'

declare var zip: any
declare var VSS: any

VSS.init()

const ensureFileLoaded = async file => {
	file.json = file.json || await new Promise(resolve => {
		file.getData(
			new zip.TextWriter(),
			text => resolve(text),
			(current, total) => {}
		)
	})
}

class Tab extends React.Component<any, any> {
	state = {
		files: [],
		fileIndex: 0,
	}
	constructor(props) {
		super(props)
		VSS.ready(() => {
			const config = VSS.getConfiguration()
			config.onBuildChanged(build => {
				VSS.require(
					['TFS/Build/RestClient'],
					async restClient => {
						const client = restClient.getClient()						
						const artifacts = await client.getArtifacts(build.id)
						if (artifacts.filter(a => a.name === 'CodeAnalysisLogs').length) {
							const logsZip = await client.getArtifactContentZip(build.id, 'CodeAnalysisLogs')
							const blob = new Blob([new Uint8Array(logsZip)])
							zip.createReader(new zip.BlobReader(blob),
								reader => {
									reader.getEntries(async entries => {
										const files = entries.filter(entry => entry.filename.endsWith('.sarif'))
										if (files.length) await ensureFileLoaded(files[0])
										this.setState({ files })
										// reader.close(() => {})
									})
								},
								error => { debugger }
							)
						} else {
							// Communicate no results found.
						}
					}
				)
			})
		})
	}
	render() {
		const {files, fileIndex} = this.state
		
		// const dd = <select value={fileIndex} onChange={async e => {
		// 		const i = e.target.value
		// 		const file = files[i]
		// 		file.json = file.json || await new Promise(resolve => {
		// 			file.getData(
		// 				new zip.TextWriter(),
		// 				text => resolve(text),
		// 				(current, total) => console.log(current, total)
		// 			)
		// 		})
		// 		this.setState({ fileIndex: i })
		// 	}}
		// 	style={{ margin: 15, marginBottom: 0 }}>
		// 	{files.map((f, i) => <option key={i} value={i}>{f.filename.replace('CodeAnalysisLogs/', '')}</option>)}
		// </select>
		
		const dd = <Dropdown className="resultsDropdown"
			options={files.map((f, i) => ({ key: i, text: f.filename.replace('CodeAnalysisLogs/', '') }))}
			selectedKey={fileIndex}
			onChanged={async option => {
					const i = option.key
					const file = files[i]
					await ensureFileLoaded(file)
					this.setState({ fileIndex: i })
				}} />
		
		return files.length && files[fileIndex].json
			? <ResultsViewer sarif={files[fileIndex].json} prefix={dd} />
			: <div className="full">No SARIF artifacts found.</div>
	}
}

ReactDOM.render(<Tab />, document.getElementById("app"))
