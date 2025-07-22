import '@/styles/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Editor from './pages';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Editor />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
